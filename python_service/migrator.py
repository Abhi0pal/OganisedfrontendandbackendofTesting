from sqlalchemy import create_engine, text
import pandas as pd
import io
import os
import re
import uuid
from datetime import datetime
import pytz


def safe_identifier(name: str):
    """
    Allow only safe SQL identifiers like:
    table_name, column_name
    """
    if not name or not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
        raise ValueError(f"Invalid identifier: {name}")
    return name


def extract_table_name(sql):
    """
    Extract table name from CREATE TABLE script.

    Supports:
    - CREATE TABLE [MASTER_USERS] (
    - CREATE TABLE dbo.[MASTER_USERS] (
    - CREATE TABLE public.users (
    - CREATE TABLE "public"."users" (
    """

    match = re.search(
        r'create\s+table\s+(if\s+not\s+exists\s+)?([^\s(]+)',
        sql,
        re.IGNORECASE
    )

    if not match:
        raise ValueError("Could not detect table name")

    table_name = match.group(2).strip()

    if "." in table_name:
        table_name = table_name.split(".")[-1]

    table_name = (
        table_name
        .replace("[", "")
        .replace("]", "")
        .replace('"', "")
        .strip()
    )

    return table_name


def run_migration(
    ssms_url,
    pg_url,
    ssms_script,
    pg_script,
    mappings,
    migrated_value,
    flag_column
):
    """
    Existing DB-to-DB migration:
    SQL Server -> PostgreSQL
    """
    src = create_engine(ssms_url)
    dest = create_engine(pg_url)

    source_table = safe_identifier(extract_table_name(ssms_script))
    target_table = safe_identifier(extract_table_name(pg_script))
    flag_column = safe_identifier(flag_column)

    batch_id = str(uuid.uuid4())
    # migrated_at = datetime.utcnow()
    ist = pytz.timezone("Asia/Kolkata")
    migrated_at = datetime.now(ist).replace(tzinfo=None)
    
    inserted_rows = 0

    with src.connect() as s, dest.begin() as d:

        if not flag_column.strip():
            raise ValueError("Flag column name is required")

        d.execute(
            text(
                f'ALTER TABLE public."{target_table}" '
                f'ADD COLUMN IF NOT EXISTS "{flag_column}" INTEGER DEFAULT 0'
            )
        )

        d.execute(
            text(
                f'ALTER TABLE public."{target_table}" '
                f'ADD COLUMN IF NOT EXISTS "migration_batch_id" TEXT'
            )
        )

        d.execute(
            text(
                f'ALTER TABLE public."{target_table}" '
                f'ADD COLUMN IF NOT EXISTS "migrated_at" TIMESTAMP'
            )
        )

        rows = s.execute(
            text(f'SELECT TOP 10 * FROM [{source_table}]')
        ).fetchall()

        for row in rows:
            row_dict = {k.lower(): v for k, v in row._asdict().items()}
            data = {}

            for m in mappings:
                target = str(m.get("target", "")).strip()
                source = str(m.get("source", "")).strip()

                source = source.replace("[", "").replace("]", "")

                if not target or target.lower() == "n/a":
                    continue

                if source.upper() == "N/A":
                    data[target] = None
                else:
                    data[target] = row_dict.get(source.lower())

            data[flag_column] = int(migrated_value)
            data["migration_batch_id"] = batch_id
            data["migrated_at"] = migrated_at

            if not data:
                continue

            cols = ", ".join(f'"{k}"' for k in data.keys())
            vals = ", ".join(f":{k}" for k in data.keys())

            query = text(
                f'INSERT INTO public."{target_table}" ({cols}) VALUES ({vals})'
            )

            d.execute(query, data)
            inserted_rows += 1

    return {
        "success": True,
        "batch_id": batch_id,
        "inserted_rows": inserted_rows,
        "target_table": target_table
    }


def read_uploaded_file(content: bytes, filename: str) -> pd.DataFrame:
    """
    Read uploaded csv/xlsx into DataFrame
    """
    lower_name = filename.lower()

    if lower_name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))

    if lower_name.endswith(".xlsx"):
        return pd.read_excel(io.BytesIO(content))

    raise ValueError(f"Unsupported file type: {filename}")


def get_target_columns(conn, table_name: str):
    """
    Fetch valid PostgreSQL columns from target table
    """
    result = conn.execute(
        text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table_name
        """),
        {"table_name": table_name}
    ).fetchall()

    return {row[0] for row in result}


def get_target_column_meta(conn, table_name: str):
    """
    Fetch PostgreSQL column data types + max length
    """
    result = conn.execute(
        text("""
            SELECT
                column_name,
                data_type,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table_name
        """),
        {"table_name": table_name}
    ).fetchall()

    return {
        row[0]: {
            "data_type": row[1],
            "max_length": row[2]
        }
        for row in result
    }


def convert_value(value, pg_type: str, max_length=None):
    """
    Basic value conversion for PostgreSQL target types
    with varchar length validation
    """
    if pd.isna(value):
        return None

    if pg_type is None:
        return value

    pg_type = pg_type.lower()

    if value == "":
        return None

    try:
        if pg_type in ("integer", "smallint", "bigint"):
            return int(float(value))

        if pg_type in ("numeric", "decimal", "real", "double precision"):
            return float(value)

        if pg_type in ("boolean",):
            if isinstance(value, bool):
                return value

            val = str(value).strip().lower()
            if val in ("1", "true", "yes", "y"):
                return True
            if val in ("0", "false", "no", "n"):
                return False
            return None

        if "timestamp" in pg_type or pg_type == "date":
            parsed = pd.to_datetime(value, errors="coerce")
            if pd.isna(parsed):
                return None
            if pg_type == "date":
                return parsed.date()
            return parsed.to_pydatetime()

        # text/varchar/char handling
        if isinstance(value, float) and value.is_integer():
            text_value = str(int(value))
        else:
            text_value = str(value).strip()

        if max_length is not None and len(text_value) > max_length:
            raise ValueError(
                f"value '{text_value}' exceeds max length {max_length} for type {pg_type}"
            )

        return text_value

    except ValueError:
        raise
    except Exception:
        return None


def parse_source_reference(source_value: str):
    """
    source_value format:
    filename||column_name
    """
    if not source_value:
        return "", ""

    if "||" not in source_value:
        return "", source_value.strip()

    file_name, column_name = source_value.split("||", 1)
    return file_name.strip(), column_name.strip()


def normalize_col(name: str):
    return str(name).strip().lower()


def run_excel_csv_migration(
    pg_url,
    pg_script,
    mappings,
    migrated_value,
    flag_column,
    common_key,
    files
):
    """
    Excel/CSV -> PostgreSQL migration
    Merge rows from multiple files using a common key
    such as TRAN_no, then insert one row per common key.
    """
    dest = create_engine(pg_url)

    target_table = safe_identifier(extract_table_name(pg_script))
    flag_column = safe_identifier(flag_column)

    batch_id = str(uuid.uuid4())
    ist = pytz.timezone("Asia/Kolkata")
    migrated_at = datetime.now(ist).replace(tzinfo=None)
    inserted_count = 0

    common_key_norm = normalize_col(common_key)

    with dest.begin() as conn:
        if not flag_column.strip():
            raise ValueError("Flag column name is required")

        conn.execute(
            text(
                f'ALTER TABLE public."{target_table}" '
                f'ADD COLUMN IF NOT EXISTS "{flag_column}" INTEGER DEFAULT 0'
            )
        )

        conn.execute(
            text(
                f'ALTER TABLE public."{target_table}" '
                f'ADD COLUMN IF NOT EXISTS "migration_batch_id" TEXT'
            )
        )

        conn.execute(
            text(
                f'ALTER TABLE public."{target_table}" '
                f'ADD COLUMN IF NOT EXISTS "migrated_at" TIMESTAMP'
            )
        )

        valid_target_columns = get_target_columns(conn, target_table)
        target_column_meta = get_target_column_meta(conn, target_table)

        # Step 1: read all files into memory
        file_data = {}

        for file_obj in files:
            filename = file_obj["filename"]
            content = file_obj["content"]

            df = read_uploaded_file(content, filename)

            if df.empty:
                continue

            original_cols = list(df.columns)
            normalized_source_map = {
                normalize_col(col): col
                for col in original_cols
            }

            file_data[filename] = {
                "df": df,
                "normalized_source_map": normalized_source_map
            }

        if not file_data:
            return {
                "success": True,
                "batch_id": batch_id,
                "inserted_rows": 0,
                "target_table": target_table
            }

        # Step 2: build merged records by common key
        merged_records = {}

        for filename, info in file_data.items():
            df = info["df"]
            normalized_source_map = info["normalized_source_map"]

            original_common_key = normalized_source_map.get(common_key_norm)

            if not original_common_key:
                raise ValueError(
                    f"Common key '{common_key}' not found in file '{filename}'"
                )

            for row_index, row in df.iterrows():
                raw_key = row.get(original_common_key)

                if pd.isna(raw_key) or str(raw_key).strip() == "":
                    continue

                if isinstance(raw_key, float) and raw_key.is_integer():
                    merge_key = str(int(raw_key)).strip()
                else:
                    merge_key = str(raw_key).strip()

                if merge_key not in merged_records:
                    merged_records[merge_key] = {}

                merged_records[merge_key][filename] = row

        # Step 3: create one insert row per common key
        for merge_key, per_file_rows in merged_records.items():
            data = {}

            for m in mappings:
                target = str(m.get("target", "")).strip()
                source = str(m.get("source", "")).strip()

                if not target or target.lower() == "n/a":
                    continue

                if not source or source.upper() == "N/A":
                    continue

                if target not in valid_target_columns:
                    continue

                source_file, source_column = parse_source_reference(source)

                if not source_file or not source_column:
                    continue

                source_row = per_file_rows.get(source_file)
                source_info = file_data.get(source_file)

                if source_row is None or source_info is None:
                    data[target] = None
                    continue

                normalized_source_map = source_info["normalized_source_map"]
                original_source_col = normalized_source_map.get(
                    normalize_col(source_column)
                )

                if not original_source_col:
                    data[target] = None
                    continue

                raw_value = source_row.get(original_source_col)
                meta = target_column_meta.get(target, {})
                pg_type = meta.get("data_type")
                max_length = meta.get("max_length")

                try:
                    converted = convert_value(raw_value, pg_type, max_length)

                    # keep first non-null value if duplicate target mapping happens
                    if target not in data or data[target] in (None, ""):
                        data[target] = converted

                except ValueError as e:
                    raise ValueError(
                        f"Common key '{merge_key}', file '{source_file}', "
                        f"source column '{source_column}', target column '{target}': {str(e)}"
                    )

            data[flag_column] = int(migrated_value)
            data["migration_batch_id"] = batch_id
            data["migrated_at"] = migrated_at

            if not data:
                continue

            cols = ", ".join(f'"{k}"' for k in data.keys())
            vals = ", ".join(f":{k}" for k in data.keys())

            query = text(
                f'INSERT INTO public."{target_table}" '
                f'({cols}) VALUES ({vals})'
            )

            conn.execute(query, data)
            inserted_count += 1

    return {
        "success": True,
        "batch_id": batch_id,
        "inserted_rows": inserted_count,
        "target_table": target_table
    }

def rollback_migration_batch(pg_url, pg_script, batch_id):
    """
    Roll back inserted rows for a given migration batch
    """
    dest = create_engine(pg_url)
    target_table = safe_identifier(extract_table_name(pg_script))

    with dest.begin() as conn:
        result = conn.execute(
            text(
                f'DELETE FROM public."{target_table}" '
                f'WHERE "migration_batch_id" = :batch_id'
            ),
            {"batch_id": batch_id}
        )

    return {
        "success": True,
        "deleted_rows": result.rowcount,
        "batch_id": batch_id,
        "target_table": target_table
    }


def get_sample_data():
    try:
        engine = create_engine(os.getenv("SSMS_CONN_STR"))
        samples = {}

        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT TOP 5 * FROM MASTER_USERS")
            ).fetchall()

            for row in result:
                row_dict = row._asdict()

                for k, v in row_dict.items():
                    if v is not None:
                        samples[k.lower()] = str(v)

        return samples

    except Exception:
        return {}