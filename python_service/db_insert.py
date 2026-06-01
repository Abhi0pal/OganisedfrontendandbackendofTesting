"""
DB Insert Engine for swcs_form_builder.
Inserts AI-generated JSON into m_fb_* tables in correct order.
Uses exact column names from Prisma schema.

Key differences from PoC:
- is_active = 'Y'/'N' (YnFlag) for most tables
- FormCategory/FormField use Boolean is_active (true/false)
- FormField active column = is_formvar_active
- grid_span (not col_span), preference (not sort_order)
- field_options stored as JSON in static_options column
- form_rules use when_json / then_json
"""
import json
import re
import uuid as uuid_lib
from db import get_connection, get_cursor


# ─────────────────────────────────────────────────────────────────────────────
# PIPELINE HELPERS — find-or-create each prerequisite in correct order
# ─────────────────────────────────────────────────────────────────────────────

def _slugify(name: str) -> str:
    """Convert name to URL-safe slug: lowercase + hyphens."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def pipeline_find_or_create_tenant(cur, name: str) -> dict:
    """
    Find tenant by name (case-insensitive), or create if not exists.
    Returns {"id": int, "name": str, "created": bool}
    """
    cur.execute("SELECT id, name FROM tenants WHERE LOWER(name) = LOWER(%s) AND is_active = true LIMIT 1", (name,))
    row = cur.fetchone()
    if row:
        return {"id": row["id"], "name": row["name"], "created": False}

    slug = _slugify(name)
    # Ensure slug is unique
    cur.execute("SELECT id FROM tenants WHERE slug = %s", (slug,))
    if cur.fetchone():
        slug = f"{slug}-{str(uuid_lib.uuid4())[:8]}"

    # Generate tenant_id_code: TN_001, TN_002, ...
    cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM tenants")
    n = cur.fetchone()["next"]
    tenant_id_code = f"TN_{str(n).zfill(3)}"

    cur.execute(
        """INSERT INTO tenants (uid, name, slug, tenant_id_code, is_active, created_at, updated_at)
           VALUES (%s, %s, %s, %s, true, NOW(), NOW()) RETURNING id, name""",
        (str(uuid_lib.uuid4()), name, slug, tenant_id_code),
    )
    row = cur.fetchone()
    return {"id": row["id"], "name": row["name"], "created": True}


def pipeline_find_or_create_project(cur, tenant_id: int, name: str, code: str | None = None) -> dict:
    """
    Find project by tenant_id + name (case-insensitive), or create if not exists.
    Returns {"id": int, "name": str, "created": bool}
    """
    cur.execute(
        "SELECT id, name FROM tenant_projects WHERE tenant_id = %s AND LOWER(name) = LOWER(%s) AND is_active = true LIMIT 1",
        (tenant_id, name),
    )
    row = cur.fetchone()
    if row:
        return {"id": row["id"], "name": row["name"], "created": False}

    if not code:
        code = _slugify(name).upper()[:20]
    # Ensure code unique within tenant
    cur.execute("SELECT id FROM tenant_projects WHERE tenant_id = %s AND code = %s", (tenant_id, code))
    if cur.fetchone():
        code = f"{code[:16]}_{str(uuid_lib.uuid4())[:4].upper()}"

    # Generate project_id_code: PR_001, PR_002, ...
    cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM tenant_projects")
    n = cur.fetchone()["next"]
    project_id_code = f"PR_{str(n).zfill(3)}"

    cur.execute(
        """INSERT INTO tenant_projects (uid, tenant_id, name, code, project_id_code, is_active, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, true, NOW(), NOW()) RETURNING id, name""",
        (str(uuid_lib.uuid4()), tenant_id, name, code, project_id_code),
    )
    row = cur.fetchone()
    return {"id": row["id"], "name": row["name"], "created": True}


def pipeline_find_or_create_department(cur, name: str, tenant_id: int | None = None) -> dict:
    """
    Find department by name (+ tenant_id if given), or create if not exists.
    Returns {"id": int, "name": str, "created": bool}
    """
    params = [name]
    where  = ['LOWER(name) = LOWER(%s)', '"isActive" = true']
    if tenant_id:
        where.append("(tenant_id = %s OR tenant_id IS NULL)")
        params.append(tenant_id)
    cur.execute(f'SELECT id, name FROM m_departments WHERE {" AND ".join(where)} LIMIT 1', params)
    row = cur.fetchone()
    if row:
        return {"id": row["id"], "name": row["name"], "created": False}

    # Build unique tag
    tag = re.sub(r"\s+", "_", name.strip().upper())[:80]
    cur.execute('SELECT id FROM m_departments WHERE "uniqueTag" = %s', (tag,))
    if cur.fetchone():
        tag = f"{tag}_{str(uuid_lib.uuid4())[:8].upper()}"

    abbr = "".join(w[0] for w in name.split()[:4]).upper() or "DEPT"
    cur.execute(
        """INSERT INTO m_departments
           (name, "uniqueTag", ip, "secretKey", "baseUrl", "publicKey", abbreviation,
            "deptType", tenant_id, "isActive", "createdAt", "updatedAt")
           VALUES (%s,%s,'0.0.0.0','','','','',2,%s,true,NOW(),NOW()) RETURNING id, name""",
        (name, tag, tenant_id),
    )
    row = cur.fetchone()
    return {"id": row["id"], "name": row["name"], "created": True}


def _parse_master_values(raw: str) -> list:
    """Parse comma or pipe separated string into data_list for pipeline_upsert_master_data."""
    sep = "|" if "|" in raw else ","
    items = []
    for val in raw.split(sep):
        val = val.strip()
        if not val:
            continue
        code = re.sub(r"[^\w]", "_", val.lower()).strip("_")
        code = re.sub(r"_+", "_", code)
        items.append({"code": code, "data": {"name": val, "name_en": val}})
    return items


def pipeline_find_or_create_master_definition(
    cur, tenant_id: int | None, project_id: int | None,
    name: str, code: str, created_by: int = 1,
    parent_master_code: str | None = None,
    columns: list | None = None,
    department_id: int | None = None,
) -> dict:
    """
    Find master_definition by (tenant_id, code), or create if not exists.
    For INSERT_NEW codes with M_NAME_001 pattern: auto-increments suffix if base already exists.
    Also creates MasterColumnDefinition rows if provided.
    Returns {"id": int, "name": str, "code": str, "created": bool}
    """
    if tenant_id:
        cur.execute(
            "SELECT id, name, code FROM master_definition WHERE tenant_id = %s AND code = %s LIMIT 1",
            (tenant_id, code),
        )
    else:
        cur.execute(
            "SELECT id, name, code FROM master_definition WHERE tenant_id IS NULL AND code = %s LIMIT 1",
            (code,),
        )
    row = cur.fetchone()
    if row:
        return {"id": row["id"], "name": row["name"], "code": row["code"], "created": False}

    # Smart suffix: if code is M_NAME_001, check for existing M_NAME_* and use next suffix
    base_match = re.match(r'^(.+)_(\d{3})$', code)
    if base_match:
        base_code = base_match.group(1)
        pattern = f"{base_code}_%"
        if tenant_id:
            cur.execute(
                "SELECT code FROM master_definition WHERE tenant_id = %s AND code LIKE %s",
                (tenant_id, pattern),
            )
        else:
            cur.execute(
                "SELECT code FROM master_definition WHERE tenant_id IS NULL AND code LIKE %s",
                (pattern,),
            )
        existing_codes = [r["code"] for r in cur.fetchall()]
        max_n = 0
        for ec in existing_codes:
            m = re.match(r'.+_(\d{3})$', ec)
            if m:
                max_n = max(max_n, int(m.group(1)))
        code = f"{base_code}_{str(max_n + 1).zfill(3)}"

    cur.execute(
        """INSERT INTO master_definition
           (uid, tenant_id, project_id, department_id, name, code, description, is_active, is_system,
            allow_import, display_order, parent_master_code, created_by, created_at, updated_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,true,false,true,0,%s,%s,NOW(),NOW())
           RETURNING id, name, code""",
        (str(uuid_lib.uuid4()), tenant_id, project_id, department_id, name, code, f"{name} master", parent_master_code, created_by),
    )
    row = cur.fetchone()
    master_id = row["id"]

    # Insert column definitions if provided
    for i, col in enumerate(columns or []):
        cur.execute(
            """INSERT INTO master_column_definition
               (master_id, column_key, column_label, data_type, is_required, is_unique,
                is_searchable, is_listable, is_filterable, display_order)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON CONFLICT (master_id, column_key) DO NOTHING""",
            (
                master_id,
                col.get("column_key", f"col_{i}"),
                col.get("column_label", f"Column {i+1}"),
                col.get("data_type", "TEXT"),
                col.get("is_required", False),
                col.get("is_unique", False),
                col.get("is_searchable", True),
                col.get("is_listable", True),
                col.get("is_filterable", False),
                i,
            ),
        )
    return {"id": master_id, "name": row["name"], "code": row["code"], "created": True}


def pipeline_upsert_master_data(cur, master_id: int, data_list: list, tenant_id: int | None = None) -> list:
    """
    Insert master_data rows (skip if code already exists for this master).
    Returns list of {"id", "code", "created"} dicts.
    """
    results = []
    for item in data_list:
        code = item.get("code", "")
        if not code:
            continue
        cur.execute(
            "SELECT id FROM master_data WHERE master_id = %s AND code = %s LIMIT 1",
            (master_id, code),
        )
        row = cur.fetchone()
        if row:
            results.append({"id": row["id"], "code": code, "created": False})
            continue
        data_json = item.get("data", {})
        if not isinstance(data_json, dict):
            data_json = {"name": str(data_json)}
        cur.execute(
            """INSERT INTO master_data (uid, code, master_id, tenant_id, data, is_active, created_at, updated_at)
               VALUES (%s,%s,%s,%s,%s,true,NOW(),NOW()) RETURNING id""",
            (str(uuid_lib.uuid4()), code, master_id, tenant_id, json.dumps(data_json)),
        )
        new_id = cur.fetchone()["id"]
        results.append({"id": new_id, "code": code, "created": True})
    return results


def pipeline_find_or_create_service(
    cur,
    department_id: int,
    service_name: str,
    tenant_id: int | None = None,
    project_id: int | None = None,
    name_in_hindi: str | None = None,
) -> dict:
    """
    Find service by department_id + name (case-insensitive), or create if not exists.
    Returns {"id": int, "service_id": str, "service_name": str, "created": bool}
    """
    params: list = [service_name, department_id]
    where = ['LOWER(service_name) = LOWER(%s)', 'department_id = %s', '"isActive" = true']
    if tenant_id:
        where.append("(tenant_id = %s OR tenant_id IS NULL)")
        params.append(tenant_id)
    cur.execute(f'SELECT id, service_id, service_name FROM m_service WHERE {" AND ".join(where)} LIMIT 1', params)
    row = cur.fetchone()
    if row:
        return {"id": row["id"], "service_id": row["service_id"], "service_name": row["service_name"], "created": False}

    # Auto-generate service_id: max_int + 1 then ".0"
    cur.execute(
        """SELECT COALESCE(MAX(CAST(SPLIT_PART(service_id, '.', 1) AS INTEGER)), 0) + 1 AS next
           FROM m_service WHERE service_id ~ '^[0-9]+\\.[0-9]+$'"""
    )
    next_int = cur.fetchone()["next"] or 1
    new_service_id = f"{next_int}.0"

    cur.execute(
        """INSERT INTO m_service
           (uid, service_id, service_name, name_in_hindi, department_id,
            tenant_id, project_id, "isActive", "createdAt", "updatedAt")
           VALUES (%s,%s,%s,%s,%s,%s,%s,true,NOW(),NOW())
           RETURNING id, service_id, service_name""",
        (str(uuid_lib.uuid4()), new_service_id, service_name, name_in_hindi, department_id, tenant_id, project_id),
    )
    row = cur.fetchone()
    return {"id": row["id"], "service_id": row["service_id"], "service_name": row["service_name"], "created": True}


def insert_pipeline(pipeline_payload: dict, form_version: str = "v1") -> dict:
    """
    Full pipeline insert — runs all steps in order:
      1. Tenant
      2. Project
      3. Department
      4. Master Definitions (Department + Sub Department + any extras)
      5. Master Data
      6. Service
      7-14. Form (categories → fields → mapping → pages → mappings → builder_fields → addmore → docs)

    pipeline_payload structure:
    {
      "pipeline": {
        "tenant":  { "name": "..." },
        "project": { "name": "...", "code": "..." },
        "department": { "name": "..." },
        "master_definitions": [
          { "name": "Department", "code": "DEPT", "columns": [...], "data": [...] },
          { "name": "Sub Department", "code": "SUB_DEPT", "parent_master_code": "DEPT",
            "columns": [...], "data": [...] }
        ],
        "service": { "name": "...", "name_in_hindi": "..." }
      },
      "form_payload": { ...existing insert_form payload... },
      "checklist_payload": { ...existing insert_documents_only payload... },
      "workflow_payload": { ...existing insert_workflow payload... }
    }
    """
    conn = get_connection()
    conn.autocommit = False
    cur  = get_cursor(conn)

    result = {
        "steps": {},
        "form": None,
        "documents": None,
        "workflow": None,
    }

    try:
        pipe = pipeline_payload.get("pipeline", {})
        tenant_info = pipe.get("tenant", {})
        project_info = pipe.get("project", {})
        dept_info = pipe.get("department", {})
        service_info = pipe.get("service", {})
        master_defs = pipe.get("master_definitions", [])

        # ── STEP 1: Tenant ───────────────────────────────────────────────────────
        if tenant_info.get("name"):
            t = pipeline_find_or_create_tenant(cur, tenant_info["name"])
            result["steps"]["tenant"] = t
            tenant_id = t["id"]
        else:
            # Accept direct tenant_id from pipe dict (set when user selects from dropdown)
            tenant_id = pipe.get("tenant_id") or pipeline_payload.get("tenant_id")
            result["steps"]["tenant"] = {"id": tenant_id, "skipped": True}

        # ── STEP 2: Project ──────────────────────────────────────────────────────
        if project_info.get("name") and tenant_id:
            p = pipeline_find_or_create_project(cur, tenant_id, project_info["name"], project_info.get("code"))
            result["steps"]["project"] = p
            project_id = p["id"]
        else:
            project_id = pipe.get("project_id") or pipeline_payload.get("project_id")
            result["steps"]["project"] = {"id": project_id, "skipped": True}

        # ── STEP 3: Department ───────────────────────────────────────────────────
        if dept_info.get("name"):
            d = pipeline_find_or_create_department(cur, dept_info["name"], tenant_id)
            result["steps"]["department"] = d
            dept_id = d["id"]
        else:
            dept_id = pipe.get("department_id") or pipeline_payload.get("department_id")
            result["steps"]["department"] = {"id": dept_id, "skipped": True}

        # ── STEP 4 + 5: Master Definitions + Data ────────────────────────────────
        master_results = []
        master_ref_to_id: dict = {}  # form master ref → DB id (for future field_options wiring)

        # Process pipeline-level master_definitions (from Agent 4 / UI dropdown)
        for md in master_defs:
            md_res = pipeline_find_or_create_master_definition(
                cur,
                tenant_id=tenant_id,
                project_id=project_id,
                department_id=dept_id,
                name=md["name"],
                code=md["code"],
                created_by=md.get("created_by", 1),
                parent_master_code=md.get("parent_master_code"),
                columns=md.get("columns", []),
            )
            data_results = []
            if md.get("data"):
                raw_data = md["data"]
                # Parse string values (comma or pipe separated) into data_list
                if isinstance(raw_data, str):
                    raw_data = _parse_master_values(raw_data)
                if isinstance(raw_data, list):
                    data_results = pipeline_upsert_master_data(cur, md_res["id"], raw_data, tenant_id)
            master_results.append({**md_res, "data": data_results})

        # Process form_payload master_definitions + master_data_rows (from Agent 1)
        form_payload_data = pipeline_payload.get("form_payload", {})
        form_master_defs = form_payload_data.get("master_definitions", [])
        form_master_data_rows = form_payload_data.get("master_data_rows", [])

        # Group form master_data_rows by master_ref
        mdr_by_ref: dict = {}
        for mdr in form_master_data_rows:
            ref = mdr.get("master_ref", "")
            mdr_by_ref.setdefault(ref, []).append(mdr)

        for md in form_master_defs:
            action = str(md.get("action", "")).upper()
            if action == "USE_EXISTING":
                if md.get("existing_id"):
                    master_ref_to_id[md.get("ref", "")] = md["existing_id"]
                continue
            if action not in ("INSERT_NEW", "NEW", "CREATE"):
                continue
            data_rows = mdr_by_ref.get(md.get("ref", ""), [])
            data_list = [
                {
                    "code": r.get("code", ""),
                    "data": r.get("data") or {"name": r.get("label", r.get("code", ""))},
                }
                for r in data_rows
                if r.get("action", "").upper() in ("INSERT_NEW", "NEW") and r.get("code")
            ]
            md_res = pipeline_find_or_create_master_definition(
                cur,
                tenant_id=tenant_id,
                project_id=project_id,
                department_id=dept_id,
                name=md["name"],
                code=md["code"],
                parent_master_code=md.get("parent_master_code"),
                columns=md.get("columns", []),
            )
            master_ref_to_id[md.get("ref", "")] = md_res["id"]
            if data_list:
                pipeline_upsert_master_data(cur, md_res["id"], data_list, tenant_id)
            master_results.append({**md_res, "data_count": len(data_list)})

        result["steps"]["master_definitions"] = master_results

        # ── STEP 6: Service ──────────────────────────────────────────────────────
        # If user selected an existing service from dropdown, use that directly
        direct_service_id = pipe.get("service_id")
        if direct_service_id and direct_service_id != "NEW":
            service_id = direct_service_id
            result["steps"]["service"] = {"service_id": service_id, "skipped": True}
        elif service_info.get("name") and dept_id:
            svc = pipeline_find_or_create_service(
                cur,
                department_id=dept_id,
                service_name=service_info["name"],
                tenant_id=tenant_id,
                project_id=project_id,
                name_in_hindi=service_info.get("name_in_hindi"),
            )
            result["steps"]["service"] = svc
            service_id = svc["service_id"]
        else:
            service_id = pipeline_payload.get("service_id") or (
                pipeline_payload.get("form_payload", {}).get("meta", {}).get("service_id")
            )
            result["steps"]["service"] = {"service_id": service_id, "skipped": True}

        # ── STEPS 7–14: Form insert ──────────────────────────────────────────────
        form_payload = pipeline_payload.get("form_payload", {})
        if form_payload:
            # Inject resolved tenant/project/dept/service IDs into form meta
            meta = form_payload.setdefault("meta", {})
            if tenant_id:
                meta["tenant_id"]     = tenant_id
            if project_id:
                meta["project_id"]    = project_id
            if dept_id:
                meta["department_id"] = dept_id
            if service_id:
                meta["service_id"]    = service_id

            conn.commit()   # commit pipeline steps before form insert (insert_form opens its own conn)
            form_res = insert_form(form_payload, form_version=form_version)
            result["form"] = form_res

        # ── Document insert ──────────────────────────────────────────────────────
        checklist_payload = pipeline_payload.get("checklist_payload", {})
        if checklist_payload:
            # Re-open cursor for document insert (insert_form closed its connection)
            conn2 = get_connection()
            conn2.autocommit = False
            cur2  = get_cursor(conn2)
            try:
                dms_payload, dcl_map = insert_documents_only(
                    checklist_payload, cur2,
                    tenant_id=tenant_id, project_id=project_id
                )
                if dms_payload and service_id:
                    cur2.execute(
                        'UPDATE m_service SET "dms" = %s WHERE service_id = %s',
                        (json.dumps(dms_payload), str(service_id))
                    )
                conn2.commit()
                result["documents"] = {"dcl_map": dcl_map, "success": True}
            except Exception as doc_err:
                conn2.rollback()
                result["documents"] = {"error": str(doc_err)}
            finally:
                cur2.close()
                conn2.close()

        # ── Workflow insert ──────────────────────────────────────────────────────
        workflow_payload = pipeline_payload.get("workflow_payload")
        if workflow_payload and dept_id and service_id:
            try:
                wf_res = insert_workflow_v2(workflow_payload)
                result["workflow"] = wf_res
            except Exception as wf_err:
                result["workflow"] = {"error": str(wf_err)}

        return result

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass


def table_columns(cur, table_name: str) -> set[str]:
    cur.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = %s",
        (table_name,),
    )
    return {row["column_name"] for row in cur.fetchall()}


# ── Code Generators ──────────────────────────────────────────────────────────

def next_category_code(cur) -> str:
    """UK-CAT-NNN_0 (3-digit padded, based on current MAX id)"""
    cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM m_fb_form_categories")
    n = cur.fetchone()["next"]
    return f"UK-CAT-{str(n).zfill(3)}_0"


def next_formchk_id(cur) -> str:
    """UK-FCL-NNNNN_0 (5-digit padded, based on current MAX id)"""
    cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM m_fb_form_field")
    n = cur.fetchone()["next"]
    return f"UK-FCL-{str(n).zfill(5)}_0"


def generate_form_code(service_id: str, mapping_id: int, form_type_id: int) -> str:
    """UK-SR-{int}_{dec2}-FRM-{mapping_id}_{type_pad2}"""
    parts = service_id.split(".")
    int_p = parts[0]
    dec_p = str(parts[1]).zfill(2) if len(parts) > 1 else "00"
    return f"UK-SR-{int_p}_{dec_p}-FRM-{mapping_id}_{str(form_type_id).zfill(2)}"


def generate_page_code(service_id: str, page_seq: int) -> str:
    """UK-SR-{int}_{dec2}-FRM-{page_seq_pad2}"""
    parts = service_id.split(".")
    int_p = parts[0]
    dec_p = str(parts[1]).zfill(2) if len(parts) > 1 else "00"
    return f"UK-SR-{int_p}_{dec_p}-FRM-{str(page_seq).zfill(2)}"


# ── Ref Resolver ─────────────────────────────────────────────────────────────

def resolve(value, maps: dict):
    """
    Replace __REF__map_name[$KEY] with actual integer from runtime maps.
    e.g. "__REF__page_id_map[$P1]" → 42
    """
    if not isinstance(value, str) or "__REF__" not in value:
        return value
    key = value.replace("__REF__", "")  # "page_id_map[$P1]"
    map_name, label = key.split("[", 1)
    label = label.rstrip("]")
    return maps[map_name][label]


def resolve_ref(ref_str: str, maps: dict):
    """Resolve a plain ref like '$P1' from a named map."""
    return maps.get(ref_str)


# ── Main Insert Function ──────────────────────────────────────────────────────

def insert_form(payload: dict, form_version: str = "v1") -> dict:
    """
    Insert form data into swcs_form_builder m_fb_* tables.

    Steps:
    1. Categories
    2. Form Fields
    3. Form Mapping
    4. Page Masters
    5. Page-Category Mappings
    6. Builder Fields
    7. Field Options (static_options JSON)
    8. Add-More Groups
    9. Add-More Columns
    10. Form Rules

    Returns summary dict with all inserted IDs.
    """
    conn = get_connection()
    cur  = get_cursor(conn)

    meta        = payload["meta"]
    department_id = meta["department_id"]
    service_id    = meta["service_id"]
    form_type_id  = meta["form_type_id"]
    form_name     = meta["form_name"]
    tenant_id     = meta.get("tenant_id")
    project_id    = meta.get("project_id")

    # Runtime ID maps
    maps = {
        "cat_id_map":           {},   # $C1 → db id
        "field_id_map":         {},   # $F1 → db id
        "field_code_map":       {},   # $F1 → formchk_id string
        "form_mapping_id":      {},   # $FM1 → db id (always $FM1)
        "page_id_map":          {},   # $P1 → db id
        "builder_field_id_map": {},   # $BF1 → db id
        "addmore_group_id_map": {},   # $AG1 → db id
    }

    try:
        # ── STEP 0: Master Definitions — resolve/create before field_options ─
        # Must run FIRST so master_table_id is available when inserting field_options.
        # Works for both pipeline flow (masters already committed) and direct insert flow.
        master_ref_to_db_id: dict = {}  # "$MD1" → master_definition.id
        for md in payload.get("master_definitions", []):
            ref    = md.get("ref", "")
            code   = md.get("code", "")
            action = str(md.get("action", "")).upper()
            if not ref or not code:
                continue
            if action == "USE_EXISTING":
                # Resolve by code from master_definition table (not master_tables legacy)
                try:
                    if tenant_id:
                        cur.execute(
                            "SELECT id FROM master_definition WHERE code = %s AND tenant_id = %s LIMIT 1",
                            (code, tenant_id),
                        )
                    else:
                        cur.execute(
                            "SELECT id FROM master_definition WHERE code = %s LIMIT 1", (code,)
                        )
                    row = cur.fetchone()
                    if row:
                        master_ref_to_db_id[ref] = row["id"]
                    elif md.get("existing_id"):
                        master_ref_to_db_id[ref] = md["existing_id"]
                except Exception:
                    if md.get("existing_id"):
                        master_ref_to_db_id[ref] = md["existing_id"]
            elif action in ("INSERT_NEW", "NEW", "CREATE"):
                # Create master if not yet created (no-op if pipeline already created it)
                try:
                    md_res = pipeline_find_or_create_master_definition(
                        cur,
                        tenant_id=tenant_id,
                        project_id=project_id,
                        department_id=meta.get("department_id"),
                        name=md["name"],
                        code=code,
                        parent_master_code=md.get("parent_master_code"),
                        columns=md.get("columns", []),
                    )
                    master_ref_to_db_id[ref] = md_res["id"]
                except Exception as e:
                    print(f"[insert_form] WARNING: could not resolve master {code}: {e}")

        # ── STEP 1: Categories ──────────────────────────────────────────────
        for cat in payload.get("categories", []):
            ref = cat["ref"]
            if cat["action"] == "USE_EXISTING":
                maps["cat_id_map"][ref] = cat["existing_id"]
            else:
                # Safety check: avoid duplicate by name before inserting
                cur.execute(
                    "SELECT id FROM m_fb_form_categories WHERE LOWER(category_name) = LOWER(%s) AND is_active = true LIMIT 1",
                    (cat["category_name"],)
                )
                existing_row = cur.fetchone()
                if existing_row:
                    print(f"[insert] Category '{cat['category_name']}' already exists (id={existing_row['id']}) — reusing")
                    maps["cat_id_map"][ref] = existing_row["id"]
                    continue

                code = next_category_code(cur)
                raw_parent = cat.get("parent_id", 0)
                if isinstance(raw_parent, str) and raw_parent.startswith("$"):
                    parent_id = maps["cat_id_map"].get(raw_parent, 0)
                elif isinstance(raw_parent, str):
                    parent_id = 0
                else:
                    parent_id = raw_parent or 0
                cur.execute(
                    """INSERT INTO m_fb_form_categories
                       (uid, category_name, name_in_hindi, category_code, parent_id, is_active,
                        tenant_id, project_id, "createdAt", "updatedAt")
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                       RETURNING id""",
                    (
                        str(uuid_lib.uuid4()),
                        cat["category_name"],
                        cat.get("name_in_hindi"),
                        code,
                        parent_id,
                        cat.get("is_active", True),
                        tenant_id,
                        project_id,
                    )
                )
                maps["cat_id_map"][ref] = cur.fetchone()["id"]

        # ── STEP 2: Form Fields ─────────────────────────────────────────────
        # Normalise action value — AI may generate INSERT_NEW / NEW / CREATE / USE_EXISTING
        _CREATE_ACTIONS = {"CREATE", "INSERT_NEW", "NEW", "INSERT"}

        for ff in payload.get("form_fields", []):
            ref    = ff["ref"]
            action = str(ff.get("action", "")).upper().replace(" ", "_")

            if action == "USE_EXISTING":
                existing_id = ff.get("existing_id")
                if existing_id:
                    cur.execute("SELECT id, formchk_id FROM m_fb_form_field WHERE id = %s", (existing_id,))
                    row = cur.fetchone()
                    if row:
                        maps["field_id_map"][ref]   = row["id"]
                        maps["field_code_map"][ref] = row["formchk_id"] or ""
                        continue          # resolved — skip CREATE block
                # ID missing or not found in DB — fall through to CREATE
                action = "CREATE"

            if action in _CREATE_ACTIONS:
                # Safety check: avoid duplicate by name before inserting
                cur.execute(
                    "SELECT id, formchk_id FROM m_fb_form_field WHERE LOWER(name) = LOWER(%s) AND is_formvar_active = true LIMIT 1",
                    (ff["name"],)
                )
                existing_field = cur.fetchone()
                if existing_field:
                    print(f"[insert] Field '{ff['name']}' already exists (id={existing_field['id']}) — reusing")
                    maps["field_id_map"][ref]   = existing_field["id"]
                    maps["field_code_map"][ref] = existing_field["formchk_id"] or ""
                    continue

                code       = next_formchk_id(cur)
                cat_ref    = ff.get("category_ref")
                cat_id     = maps["cat_id_map"].get(cat_ref) if cat_ref else None
                raw_fp = ff.get("parent_id", 0)
                field_parent_id = 0 if (not raw_fp or isinstance(raw_fp, str)) else raw_fp
                cur.execute(
                    """INSERT INTO m_fb_form_field
                       (uid, formchk_id, parent_id, category_id, name, name_in_hindi,
                        is_editable, is_formvar_active, tenant_id, project_id, "createdAt", "updatedAt")
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                       RETURNING id""",
                    (
                        str(uuid_lib.uuid4()),
                        code,
                        field_parent_id,
                        cat_id,
                        ff["name"],
                        ff.get("name_in_hindi"),
                        ff.get("is_editable", "Y"),
                        ff.get("is_active", True),
                        tenant_id,
                        project_id,
                    )
                )
                new_id = cur.fetchone()["id"]
                maps["field_id_map"][ref]   = new_id
                maps["field_code_map"][ref] = code

        # ── STEP 3: Form Mapping ────────────────────────────────────────────
        form_mapping_cols = table_columns(cur, "m_fb_form_mapping")
        mapping_columns = [
            "department_id", "service_id", "form_type_id", "form_name",
            "form_code", "form_version", "is_active",
        ]
        mapping_values = [
            department_id, service_id, form_type_id, form_name,
            "__TEMP__", form_version, "Y",
        ]
        if "tenant_id" in form_mapping_cols:
            mapping_columns.append("tenant_id")
            mapping_values.append(tenant_id)
        if "project_id" in form_mapping_cols:
            mapping_columns.append("project_id")
            mapping_values.append(project_id)
        cur.execute(
            f"""INSERT INTO m_fb_form_mapping
               ({', '.join(mapping_columns)})
               VALUES ({', '.join(['%s'] * len(mapping_columns))})
               RETURNING id""",
            mapping_values,
        )
        mapping_id = cur.fetchone()["id"]
        form_code  = generate_form_code(service_id, mapping_id, form_type_id)
        cur.execute("UPDATE m_fb_form_mapping SET form_code = %s WHERE id = %s",
                    (form_code, mapping_id))
        maps["form_mapping_id"]["$FM1"] = mapping_id

        # ── STEP 4: Page Masters ────────────────────────────────────────────
        for seq, pg in enumerate(payload.get("page_masters", []), 1):
            ref       = pg["ref"]
            page_code = generate_page_code(service_id, seq)
            cur.execute(
                """INSERT INTO m_fb_page_master
                   (uid, service_id, page_name, name_in_hindi, preference, form_id, form_code, is_active,
                    tenant_id, project_id)
                   VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (
                    service_id,
                    pg["page_name"],
                    pg.get("name_in_hindi"),
                    pg.get("preference", seq),
                    form_type_id,   # NestJS queries pages by form_type_id, not mapping_id
                    page_code,
                    "Y",
                    tenant_id,
                    project_id,
                )
            )
            maps["page_id_map"][ref] = cur.fetchone()["id"]

        # ── STEP 5: Page-Category Mappings ──────────────────────────────────
        for pcm in payload.get("page_category_mappings", []):
            page_id = maps["page_id_map"].get(pcm.get("page_ref"))
            cat_id  = maps["cat_id_map"].get(pcm.get("category_ref"))
            if page_id is None or cat_id is None:
                print(f"[insert] WARNING: page_category_mapping skipped — unresolved page_ref='{pcm.get('page_ref')}' or category_ref='{pcm.get('category_ref')}'")
                continue
            cur.execute(
                """INSERT INTO m_fb_page_category_mapping
                   (page_id, category_id, preference, help_text, is_active)
                   VALUES (%s, %s, %s, %s, %s)""",
                (page_id, cat_id, pcm.get("preference", 1), pcm.get("help_text"), "Y")
            )

        # ── STEP 6: Builder Fields ──────────────────────────────────────────
        for bf in payload.get("builder_fields", []):
            ref      = bf["ref"]
            page_id  = maps["page_id_map"].get(bf.get("page_ref"))
            cat_id   = maps["cat_id_map"].get(bf.get("category_ref"))
            field_id = maps["field_id_map"].get(bf.get("field_ref"))
            if page_id is None:
                print(f"[insert] WARNING: builder_field '{ref}' unresolved page_ref='{bf.get('page_ref')}' — skipping")
                continue

            if field_id is None:
                print(f"[insert] WARNING: builder_field '{ref}' references unresolved field_ref='{bf.get('field_ref')}' — skipping")
                continue

            val_rule = bf.get("validation_rule")
            if val_rule is not None:
                if isinstance(val_rule, (dict, list)):
                    val_rule = json.dumps(val_rule)
                else:
                    # Plain string from AI — wrap as JSON string or set None
                    try:
                        json.loads(val_rule)   # already valid JSON string?
                    except (json.JSONDecodeError, TypeError):
                        val_rule = None         # discard invalid value

            comp_props = bf.get("component_props")
            if comp_props is not None:
                if isinstance(comp_props, (dict, list)):
                    comp_props = json.dumps(comp_props)
                else:
                    try:
                        json.loads(comp_props)
                    except (json.JSONDecodeError, TypeError):
                        comp_props = None

            cur.execute(
                """INSERT INTO m_fb_form_builder_fields
                   (uid, service_id, form_id, page_id, category_id, form_field_id,
                    preference, input_type, custom_label, placeholder, help_text,
                    grid_span, layout_type, component_props,
                    is_required, is_readonly, is_editable, is_active,
                    min_length, max_length, pattern, validation_rule)
                   VALUES (gen_random_uuid(),%s,%s,%s,%s,%s, %s,%s,%s,%s,%s, %s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s)
                   RETURNING id""",
                (
                    service_id, form_type_id, page_id, cat_id, field_id,  # form_id = form_type_id
                    bf.get("preference", 1),
                    bf.get("input_type", "text"),
                    bf.get("custom_label"),
                    bf.get("placeholder"),
                    bf.get("help_text"),
                    bf.get("grid_span", 6),
                    bf.get("layout_type"),
                    comp_props,
                    bf.get("is_required", "N"),
                    bf.get("is_readonly", "N"),
                    bf.get("is_editable", "Y"),
                    bf.get("is_active", "Y"),
                    bf.get("min_length"),
                    bf.get("max_length"),
                    bf.get("pattern"),
                    val_rule,
                )
            )
            maps["builder_field_id_map"][ref] = cur.fetchone()["id"]

        # ── STEP 7: Field Options ───────────────────────────────────────────
        # master_ref_to_db_id already built in Step 0 above.
        for opt in payload.get("field_options", []):
            bf_ref           = opt.get("builder_field_ref", "")
            builder_field_id = maps["builder_field_id_map"].get(bf_ref)
            if builder_field_id is None:
                print(f"[insert] WARNING: field_option skipped — unresolved builder_field_ref='{bf_ref}'")
                continue
            parent_bf_id     = None
            if opt.get("parent_builder_field_ref"):
                parent_bf_id = maps["builder_field_id_map"].get(opt["parent_builder_field_ref"])

            static_opts = opt.get("static_options")
            if static_opts is not None:
                static_opts = json.dumps(static_opts)

            # Resolve master_table_id: prefer explicit value, else resolve via master_ref
            master_table_id = opt.get("master_table_id")
            if master_table_id is None and opt.get("source_type") == "MASTER":
                m_ref = opt.get("master_ref", "")
                if m_ref:
                    master_table_id = master_ref_to_db_id.get(m_ref)

            cur.execute(
                """INSERT INTO m_fb_formfield_options
                   (uid, builder_field_id, source_type, static_options,
                    master_table_id, parent_builder_field_id, is_active)
                   VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s)""",
                (
                    builder_field_id,
                    opt.get("source_type", "STATIC"),
                    static_opts,
                    master_table_id,
                    parent_bf_id,
                    "Y",
                )
            )

        # ── STEP 8: Add-More Groups ─────────────────────────────────────────
        for ag in payload.get("addmore_groups", []):
            ref      = ag["ref"]
            page_id  = maps["page_id_map"].get(ag["page_ref"])
            cat_id   = maps["cat_id_map"].get(ag["category_ref"])
            trig_id  = maps["builder_field_id_map"].get(ag["trigger_builder_field_ref"])
            cur.execute(
                """INSERT INTO m_fb_addmore_groups
                   (service_id, form_id, page_id, category_id,
                    trigger_builder_field_id, label, min_rows, max_rows, is_active)
                   VALUES (%s,%s,%s,%s, %s,%s,%s,%s,%s)
                   RETURNING id""",
                (
                    service_id, form_type_id, page_id, cat_id,  # form_id = form_type_id
                    trig_id,
                    ag.get("label"),
                    ag.get("min_rows", 1),
                    ag.get("max_rows", 10),
                    "Y",
                )
            )
            maps["addmore_group_id_map"][ref] = cur.fetchone()["id"]

        # ── STEP 9: Add-More Columns ────────────────────────────────────────
        for ac in payload.get("addmore_columns", []):
            group_id = maps["addmore_group_id_map"].get(ac["group_ref"])
            bf_id    = maps["builder_field_id_map"].get(ac["builder_field_ref"])
            cur.execute(
                """INSERT INTO m_fb_addmore_columns
                   (group_id, builder_field_id, col_order)
                   VALUES (%s, %s, %s)""",
                (group_id, bf_id, ac.get("col_order", 1))
            )

        # ── STEP 10: Form Rules ─────────────────────────────────────────────
        for rule in payload.get("form_rules", []):
            when = rule["when_json"]
            then = rule["then_json"]

            # Resolve any field_ref / target_refs inside rule JSONs
            if isinstance(when, dict) and "field_ref" in when:
                ref_key = when["field_ref"]
                bf_id   = maps["builder_field_id_map"].get(ref_key, ref_key)
                when    = {**when, "builder_field_id": bf_id}

            if isinstance(then, dict) and "target_refs" in then:
                target_ids = [
                    maps["builder_field_id_map"].get(r, r)
                    for r in then["target_refs"]
                ]
                then = {**then, "target_builder_field_ids": target_ids}

            cur.execute(
                """INSERT INTO m_fb_form_rules
                   (service_id, form_id, scope, when_json, then_json, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    service_id, form_type_id,  # form_id = form_type_id
                    rule.get("scope", "field"),
                    json.dumps(when),
                    json.dumps(then),
                    "Y",
                )
            )

        conn.commit()

        return {
            "success":    True,
            "mapping_id": mapping_id,
            "form_code":  form_code,
            "form_version": form_version,
            "service_id": service_id,
            "maps":       {k: dict(v) for k, v in maps.items()},
        }

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def insert_documents_only(payload: dict, cur, tenant_id=None, project_id=None):

    dcl_map = {}
    document_types = payload.get("documentTypes", [])

    # Sync sequence with actual max id — seed files insert rows with explicit IDs
    # without advancing the sequence, causing nextval to return already-used IDs.
    cur.execute(
        "SELECT setval('m_document_master_id_seq', "
        "(SELECT COALESCE(MAX(id), 0) FROM m_document_master))"
    )

    for dt in document_types:
        for chk in dt.get("checklists", []):

            dcl = chk.get("id")

            if not (isinstance(dcl, str) and dcl.startswith("UK-DCL")):
                continue

            # Check 1: by checklistId
            cur.execute(
                'SELECT id, "checklistId" FROM m_document_master WHERE "checklistId" = %s',
                (dcl,)
            )
            row = cur.fetchone()

            # Check 2: by name (AI may generate new UK-DCL-xxx for same doc name)
            if not row and chk.get("name"):
                cur.execute(
                    'SELECT id, "checklistId" FROM m_document_master '
                    'WHERE LOWER("checklistDocumentName") = LOWER(%s) AND "isDocActive" = true LIMIT 1',
                    (chk["name"],)
                )
                row = cur.fetchone()

            if row:
                print(f"✅ Found existing doc '{chk.get('name')}' → id={row['id']}")
                doc_id = row["id"]
                checklist_code = row["checklistId"] or dcl

            else:
                print(f"🚀 Inserting new document: {dcl}")

                formats = chk.get("allowedFormats", [])
                ext = ",".join(formats).upper() if formats else "PDF"

                # Insert with temp placeholder — let DB assign the real id via sequence.
                # Do NOT call nextval manually; it causes a double-advance and skips an ID.
                cur.execute(
                    """INSERT INTO m_document_master
                    ("checklistId","stateId","issuerId","departmentId","documentTypeId","issuerById",
                     "checklistDocumentName","checklistDocumentExtension","checklistDocumentMaxSize",
                     "isDocActive", tenant_id, tenant_project_id, "createdAt","updatedAt")
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,true,%s,%s,NOW(),NOW())
                    RETURNING id""",
                    (
                        "__TEMP__",
                        1286,
                        2,
                        1,
                        25,
                        7,
                        chk.get("name"),
                        ext,
                        chk.get("maxSizeMb"),
                        tenant_id,
                        project_id,
                    )
                )

                doc_id = cur.fetchone()["id"]
                checklist_code = f"UK-DCL-{doc_id}"

                # Update the real checklistId now that we have the actual id
                cur.execute(
                    'UPDATE m_document_master SET "checklistId" = %s WHERE id = %s',
                    (checklist_code, doc_id)
                )
                print(f"✅ Inserted: {checklist_code} → {doc_id}")

            # ✅ FIXED MAPPING
            dcl_map[checklist_code] = doc_id

            # ✅ UPDATE JSON
            chk["id"] = doc_id

    return payload, dcl_map


# ── Workflow Insert ────────────────────────────────────────────────────────────

def get_existing_workflow(department_id: int, service_id: str) -> list[dict]:
    """Fetch existing workflow steps for this service."""
    conn = get_connection()
    cur  = get_cursor(conn)
    try:
        cur.execute(
            """SELECT id, step, role_id, config_version, status
               FROM c_application_workflow_configuration
               WHERE department_id = %s AND service_id = %s
               ORDER BY config_version DESC, step ASC""",
            (department_id, service_id)
        )
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


def get_roles_for_context() -> list[dict]:
    """Fetch all roles from DB to pass as context to AI."""
    conn = get_connection()
    cur  = get_cursor(conn)
    try:
        cur.execute("SELECT id, name FROM roles ORDER BY id")
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


def insert_workflow(department_id: int, service_id: str, payload: dict) -> dict:
    """
    Insert workflow steps into c_application_workflow_configuration.
    Deletes existing rows for (department_id, service_id, config_version) first.
    Returns {"inserted": N, "step_ids": [...]}
    """
    conn = get_connection()
    cur  = get_cursor(conn)

    config_version = payload.get("meta", {}).get("config_version", 1)
    steps = payload.get("workflow_steps", [])

    if not steps:
        raise ValueError("workflow_steps is empty — nothing to insert")

    try:
        cur.execute(
            "DELETE FROM c_application_workflow_configuration "
            "WHERE department_id = %s AND service_id = %s AND config_version = %s",
            (department_id, service_id, config_version)
        )

        step_ids = []
        for step in steps:
            cur.execute(
                """INSERT INTO c_application_workflow_configuration (
                    step, department_id, service_id, config_version, status,
                    role_id, jurisdiction_level, jurisdiction_level_id,
                    assignment_strategy, assignment_strategy_id,
                    action_master_ids_json, action_allowed_json, transition_map_json,
                    assignment_rule_json, sla_hours, sla_breach_requires_reason,
                    next_allocation_role_id, current_role_id, form_type_id,
                    next_role_id, approver_id, forward_role_id, revert_role_id,
                    is_delay_reason_required, time_in_hours,
                    can_revert_to_investor, can_verify_document,
                    can_forward_to_multiple_role_id, is_own_department,
                    permissable_tab_form_id, document_show_last, process_anytime,
                    subform_action_name
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s, %s,
                    %s
                ) RETURNING id""",
                (
                    step.get("step", 1),
                    department_id,
                    service_id,
                    config_version,
                    step.get("status", "PUBLISHED"),
                    step.get("role_id", 0),
                    step.get("jurisdiction_level", "DISTRICT"),
                    step.get("jurisdiction_level_id"),
                    step.get("assignment_strategy", "ROLE"),
                    step.get("assignment_strategy_id"),
                    json.dumps(step.get("action_master_ids_json", [])),
                    json.dumps(step.get("action_allowed_json", [])),
                    json.dumps(step.get("transition_map_json", {})),
                    json.dumps(step.get("assignment_rule_json")) if step.get("assignment_rule_json") else None,
                    step.get("sla_hours", 0),
                    step.get("sla_breach_requires_reason", True),
                    step.get("next_allocation_role_id"),
                    step.get("current_role_id", 0),
                    step.get("form_type_id", 1),
                    step.get("next_role_id", 0),
                    step.get("approver_id", 0),
                    step.get("forward_role_id", 0),
                    step.get("revert_role_id", 0),
                    step.get("is_delay_reason_required", "N"),
                    str(step.get("time_in_hours", "0")),
                    step.get("can_revert_to_investor", "N"),
                    step.get("can_verify_document", "N"),
                    step.get("can_forward_to_multiple_role_id"),
                    step.get("is_own_department", "N"),
                    step.get("permissable_tab_form_id", ""),
                    step.get("document_show_last", "N"),
                    step.get("process_anytime", "N"),
                    step.get("subform_action_name", ""),
                )
            )
            step_ids.append(cur.fetchone()["id"])

        conn.commit()
        return {"inserted": len(step_ids), "step_ids": step_ids}

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

# ── Workflow V3 Insert (wf_definitions / wf_processes / wf_process_actions / wf_transitions) ──

#Paste at the end of the file 

# ── Workflow V2 Insert Engine ──────────────────────────────────────────────────

def get_role_id_by_name(cur, role_name: str, tenant_id: int = None) -> int:
    """Robust lookup for role ID by name."""
    if not role_name:
        return None
    
    # Exact match first
    cur.execute(
        "SELECT id FROM roles WHERE name = %s AND (tenant_id = %s OR tenant_id IS NULL)",
        (role_name, tenant_id)
    )
    row = cur.fetchone()
    if row:
        return row["id"]
    
    # Normalized match (case-insensitive, trimmed, hyphen/space agnostic)
    normalized_name = role_name.strip().lower().replace("-", " ").replace("_", " ")
    cur.execute(
        "SELECT id, name FROM roles WHERE (tenant_id = %s OR tenant_id IS NULL)",
        (tenant_id,)
    )
    all_roles = cur.fetchall()
    for r in all_roles:
        r_norm = r["name"].strip().lower().replace("-", " ").replace("_", " ")
        if r_norm == normalized_name:
            return r["id"]
            
    return None


def ensure_role(cur, role_data: dict, tenant_id: int = None) -> int:
    """Ensure role exists or create it."""
    role_name = role_data["name"]
    role_id = get_role_id_by_name(cur, role_name, tenant_id)
    
    if role_id:
        return role_id
        
    print(f"Creating role: {role_name}")
    cur.execute(
        """INSERT INTO roles (uid, name, description, tenant_id, "createdAt", "updatedAt")
           VALUES (%s, %s, %s, %s, NOW(), NOW())
           RETURNING id""",
        (str(uuid_lib.uuid4()), role_name, role_data.get("description"), tenant_id)
    )
    return cur.fetchone()["id"]


def ensure_user(cur, user_data: dict, roles_map: dict) -> int:
    """Ensure user exists or create it."""
    email = user_data["email"]
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cur.fetchone()
    
    if row:
        return row["id"]
        
    role_name = user_data.get("roleName")
    role_id = roles_map.get(role_name)
    
    print(f"Creating user: {email}")
    # Insert into users table
    cur.execute(
        """INSERT INTO users (uid, email, user_type, role_id, tenant_id, department_id, is_active, "created_at", "updated_at")
           VALUES (%s, %s, %s, %s, %s, %s, true, NOW(), NOW())
           RETURNING id""",
        (
            str(uuid_lib.uuid4()),
            email, 
            user_data.get("userType", "DEPARTMENT"),
            role_id,
            user_data.get("tenantId"), # Defaulting to None if not provided
            user_data.get("departmentId")
        )
    )
    user_id = cur.fetchone()["id"]
    
    # Insert into department_users table
    cur.execute(
        """INSERT INTO department_users (user_id, full_name, email, dept_id, status, created_at, updated_at)
           VALUES (%s, %s, %s, %s, 1, NOW(), NOW())""",
        (
            user_id,
            user_data.get("fullName"),
            email,
            user_data.get("departmentId")
        )
    )
    return user_id


def _ensure_department_form(cur, service_id: str, department_id: int, tenant_id: int = None, project_id: int = None) -> int | None:
    """
    Ensure a department processing form (form_type_id=2) exists for this service.
    Reuses existing if found — no duplicates.
    Creates: category → fields → form_mapping → page → page_category_mapping → builder_fields.
    Returns form_mapping_id.
    """
    # Check if already exists for this service
    cur.execute(
        "SELECT id FROM m_fb_form_mapping WHERE service_id = %s AND form_type_id = 2 AND is_active = 'Y' LIMIT 1",
        (service_id,)
    )
    row = cur.fetchone()
    if row:
        print(f"[dept-form] Reusing existing department form id={row['id']} for service={service_id}")
        return row["id"]

    print(f"[dept-form] Creating department form (form_type_id=2) for service={service_id}")

    # 1. Category — reuse by name to avoid duplicates
    cur.execute(
        "SELECT id FROM m_fb_form_categories WHERE LOWER(category_name) = 'for department use only' AND is_active = true LIMIT 1"
    )
    cat_row = cur.fetchone()
    if cat_row:
        cat_id = cat_row["id"]
    else:
        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM m_fb_form_categories")
        n = cur.fetchone()["next"]
        cur.execute(
            """INSERT INTO m_fb_form_categories
               (uid, category_name, category_code, parent_id, is_active, tenant_id, project_id, "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), %s, %s, 0, true, %s, %s, NOW(), NOW())
               RETURNING id""",
            ("For Department Use Only", f"UK-CAT-{str(n).zfill(3)}_0", tenant_id, project_id)
        )
        cat_id = cur.fetchone()["id"]

    # 2. Fields — reuse by name to avoid duplicates
    officer_fields_def = [
        {"name": "Comment",              "input_type": "textarea", "is_required": "Y", "max_length": 1000, "validation_rule": None},
        {"name": "Supportive Documents", "input_type": "file",     "is_required": "N", "max_length": None,
         "validation_rule": json.dumps({"accept": ".pdf,.jpg,.jpeg,.png", "maxSizeMB": 5})},
    ]
    field_ids = {}
    for f in officer_fields_def:
        cur.execute(
            "SELECT id, formchk_id FROM m_fb_form_field WHERE LOWER(name) = LOWER(%s) AND is_formvar_active = true LIMIT 1",
            (f["name"],)
        )
        f_row = cur.fetchone()
        if f_row:
            field_ids[f["name"]] = {"id": f_row["id"], "code": f_row["formchk_id"]}
        else:
            cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM m_fb_form_field")
            n = cur.fetchone()["next"]
            fcode = f"UK-FCL-{str(n).zfill(5)}_0"
            cur.execute(
                """INSERT INTO m_fb_form_field
                   (uid, formchk_id, parent_id, category_id, name, is_editable, is_formvar_active, tenant_id, project_id, "createdAt", "updatedAt")
                   VALUES (gen_random_uuid(), %s, 0, %s, %s, 'Y', true, %s, %s, NOW(), NOW())
                   RETURNING id""",
                (fcode, cat_id, f["name"], tenant_id, project_id)
            )
            new_id = cur.fetchone()["id"]
            field_ids[f["name"]] = {"id": new_id, "code": fcode}

    # 3. Form Mapping
    parts = str(service_id).split(".")
    int_p = parts[0]
    dec_p = str(parts[1]).zfill(2) if len(parts) > 1 else "00"
    form_code = f"UK-SR-{int_p}_{dec_p}-FRM-DEPT-02"
    cur.execute(
        """INSERT INTO m_fb_form_mapping
           (department_id, service_id, form_type_id, form_name, form_code, form_version, is_active, tenant_id, project_id)
           VALUES (%s, %s, 2, %s, %s, 'v1', 'Y', %s, %s)
           RETURNING id""",
        (department_id, service_id, "Department Processing Form", form_code, tenant_id, project_id)
    )
    mapping_id = cur.fetchone()["id"]

    # 4. Page Master
    page_code = f"UK-SR-{int_p}_{dec_p}-FRM-DEPT-P01"
    cur.execute(
        """INSERT INTO m_fb_page_master
           (uid, service_id, page_name, preference, form_id, form_code, is_active, tenant_id, project_id)
           VALUES (gen_random_uuid(), %s, 'Department Processing', 1, 2, %s, 'Y', %s, %s)
           RETURNING id""",
        (service_id, page_code, tenant_id, project_id)
    )
    page_id = cur.fetchone()["id"]

    # 5. Page-Category Mapping
    cur.execute(
        "INSERT INTO m_fb_page_category_mapping (page_id, category_id, preference, is_active) VALUES (%s, %s, 1, 'Y')",
        (page_id, cat_id)
    )

    # 6. Builder Fields (Comment + Supportive Documents)
    for order, f_def in enumerate(officer_fields_def, 1):
        finfo = field_ids[f_def["name"]]
        cur.execute(
            """INSERT INTO m_fb_form_builder_fields
               (uid, service_id, form_id, page_id, category_id, form_field_id,
                preference, input_type, custom_label, grid_span,
                is_required, is_readonly, is_editable, is_active,
                max_length, validation_rule)
               VALUES (gen_random_uuid(), %s, 2, %s, %s, %s, %s, %s, %s, 6, %s, 'N', 'Y', 'Y', %s, %s)
               RETURNING id""",
            (
                service_id, page_id, cat_id, finfo["id"],
                order, f_def["input_type"], f_def["name"],
                f_def["is_required"], f_def["max_length"], f_def["validation_rule"]
            )
        )

    print(f"[dept-form] Created department form mapping_id={mapping_id}")
    return mapping_id


def insert_workflow_v2(payload: dict) -> dict:
    """
    Insert workflow into wf_configurations (configuration Json blob).

    Steps:
    1. Roles  — ensure all roles exist
    2. Users  — create department users (bypass if empty)
    3. Dept form — ensure form_type_id=2 form exists
    4. wf_configurations — upsert one row; processes/actions/transitions
       are stored as JSON inside the `configuration` column
    """
    conn = get_connection()
    cur  = get_cursor(conn)

    try:
        setup_data = payload.get("setup_data", {})
        wf_def     = payload.get("workflow_definition", {})

        tenant_id     = wf_def.get("tenantId")
        department_id = wf_def.get("departmentId")
        service_id    = wf_def.get("serviceId")
        wf_code       = wf_def.get("code")
        wf_version    = wf_def.get("version", 1)

        # ── STEP 1: Roles ────────────────────────────────────────────────
        roles_map = {}
        for role_data in setup_data.get("roles", []):
            role_id = ensure_role(cur, role_data, tenant_id)
            roles_map[role_data["name"]] = role_id
            print(f"[workflow] Role '{role_data['name']}' → id={role_id}")

        # ── STEP 2: Department Users (bypass if list is empty) ───────────
        users_created = 0
        for user_data in setup_data.get("users", []):
            if not user_data.get("tenantId"):
                user_data["tenantId"] = tenant_id
            if not user_data.get("departmentId"):
                user_data["departmentId"] = department_id
            try:
                ensure_user(cur, user_data, roles_map)
                users_created += 1
            except Exception as u_err:
                print(f"[workflow] WARNING: user '{user_data.get('email')}' skipped: {u_err}")
        print(f"[workflow] Users processed: {users_created} (bypassed if 0)")

        # ── STEP 3: Department Form (form_type_id=2) ─────────────────────
        dept_form_id = _ensure_department_form(
            cur, service_id, department_id, tenant_id, project_id=None
        )
        print(f"[workflow] Department form mapping_id={dept_form_id}")

        # ── STEP 4: Build configuration JSON and upsert wf_configurations ─
        processes_json = []
        for proc in wf_def.get("processes", []):
            role_name = proc.get("roleName")
            role_id   = roles_map.get(role_name) if role_name else None
            if role_name and not role_id:
                role_id = get_role_id_by_name(cur, role_name, tenant_id)

            actions_json = []
            for action in proc.get("actions", []):
                transitions_json = [
                    {
                        "targetProcessCode": t["targetProcessCode"],
                        "label": t.get("label", ""),
                        "priority": t.get("priority", 0),
                        "conditionJson": t.get("conditionJson", None),
                        "conditionLabel": t.get("conditionLabel", None),
                    }
                    for t in action.get("transitions", [])
                ]
                actions_json.append({
                    "actionCode": action["actionCode"],
                    "actionLabel": action.get("actionLabel", action["actionCode"]),
                    "requiresComment": False,
                    "requiresDocument": False,
                    "requiresReason": False,
                    "displayOrder": action.get("displayOrder", 0),
                    "transitions": transitions_json,
                })

            processes_json.append({
                "processCode": proc["processCode"],
                "stepOrder": proc["stepOrder"],
                "name": proc["name"],
                "nodeType": proc.get("nodeType", "STANDARD"),
                "assigneeType": proc.get("assigneeType", "ROLE"),
                "roleId": role_id,
                "roleName": role_name,
                "userId": None,
                "formTypeId": proc.get("formTypeId"),
                "slaHours": 0,
                "slaBreachAction": "NONE",
                "slaBreachPercentage": None,
                "canVerifyDocument": False,
                "canRevertToApplicant": False,
                "positionX": proc.get("positionX", 0),
                "positionY": proc.get("positionY", 0),
                "actions": actions_json,
                "forkJoinMetadata": None,
            })

        configuration = {
            "processes": processes_json,
            "fieldPermissions": [],
        }

        # Delete existing record (allow re-seeding)
        cur.execute(
            """DELETE FROM wf_configurations
               WHERE code = %s AND version = %s AND tenant_id = %s AND department_id = %s""",
            (wf_code, wf_version, tenant_id, department_id),
        )

        print(f"[workflow] Inserting wf_configurations: {wf_code} v{wf_version}")
        cur.execute(
            """INSERT INTO wf_configurations (
                uid, tenant_id, department_id, service_id, code, name, description,
                version, status, configuration, created_at, updated_at
               ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, NOW(), NOW())
               RETURNING id""",
            (
                str(uuid_lib.uuid4()),
                tenant_id, department_id, service_id, wf_code,
                wf_def.get("name"), wf_def.get("description"),
                wf_version, wf_def.get("status", "PUBLISHED"),
                json.dumps(configuration),
            ),
        )
        wf_config_id = cur.fetchone()["id"]

        conn.commit()
        return {
            "success": True,
            "wf_config_id": wf_config_id,
            "workflow_code": wf_code,
            "processes_count": len(processes_json),
        }

    except Exception as e:
        conn.rollback()
        print(f"Error in insert_workflow_v2: {str(e)}")
        raise e
    finally:
        cur.close()
        conn.close()


# ── Master Insert Engine ───────────────────────────────────────────────────────

def _master_name_to_code_part(name: str) -> str:
    """
    Matches backend logic exactly:
    name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    """
    code = name.upper().strip()
    code = re.sub(r"[^A-Z0-9]+", "_", code)
    return code.strip("_")


def _ensure_master_definition(cur, name: str, tenant_id: int, project_id: int = None,
                               description: str = None) -> dict:
    """
    Find master_definition by (LOWER(name), tenant_id, project_id) or create.
    Duplicate check matches backend: name (case-insensitive) + tenant_id + project_id.
    Returns {"id": int, "code": str}
    """
    cur.execute(
        """SELECT id, code FROM master_definition
           WHERE LOWER(name) = LOWER(%s)
             AND (tenant_id = %s OR (tenant_id IS NULL AND %s IS NULL))
             AND (project_id = %s OR (project_id IS NULL AND %s IS NULL))
           LIMIT 1""",
        (name.strip(), tenant_id, tenant_id, project_id, project_id),
    )
    row = cur.fetchone()
    if row:
        print(f"[master] Definition '{name}' already exists → id={row['id']} code={row['code']}")
        return {"id": row["id"], "code": row["code"]}

    # Code format: M_<NAMEPART>_<seq>  (matches frontend previewCode())
    name_part = _master_name_to_code_part(name)
    cur.execute("SELECT COUNT(*) AS cnt FROM master_definition")
    seq = str(cur.fetchone()["cnt"] + 1).zfill(3)
    code = f"M_{name_part}_{seq}"

    cur.execute(
        """INSERT INTO master_definition (
               uid, tenant_id, project_id, name, code, description,
               is_active, is_system, allow_import, display_order, created_by,
               created_at, updated_at
           ) VALUES (%s, %s, %s, %s, %s, %s, true, false, true, 0, 0, NOW(), NOW())
           RETURNING id, code""",
        (str(uuid_lib.uuid4()), tenant_id, project_id,
         name.strip(), code, (description or name).strip()),
    )
    r = cur.fetchone()
    print(f"[master] Created definition '{name}' code={r['code']} → id={r['id']}")
    return {"id": r["id"], "code": r["code"]}


def _ensure_master_data_row(cur, master_id: int, master_code: str,
                             name: str, tenant_id: int,
                             abbr: str = None, extra_data: dict = None) -> int:
    """
    Find master_data row by (master_id, LOWER(data->>'name')) or create.
    Duplicate check matches backend: master_id + LOWER(data->>'name') only.
    master_data.code = master_definition.code  (matches backend create() logic).
    data JSON: { "name": ..., "abbr": ...(optional), ...extra_data }
    Returns master_data.id.
    """
    cur.execute(
        """SELECT id FROM master_data
           WHERE master_id = %s
             AND LOWER(data->>'name') = LOWER(%s)
           LIMIT 1""",
        (master_id, name.strip()),
    )
    row = cur.fetchone()
    if row:
        return row["id"]

    data_json: dict = {"name": name.strip()}
    if abbr:
        data_json["abbr"] = abbr
    if extra_data:
        data_json.update(extra_data)

    cur.execute(
        """INSERT INTO master_data (uid, code, master_id, tenant_id, data, is_active, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s::jsonb, true, NOW(), NOW())
           RETURNING id""",
        (str(uuid_lib.uuid4()), master_code, master_id, tenant_id, json.dumps(data_json)),
    )
    return cur.fetchone()["id"]


def insert_masters(payload: dict) -> dict:
    """
    Insert master definitions and their data rows.

    Expected payload:
    {
      "tenant_id": int,
      "project_id": int | null,
      "masters": [
        {
          "name": "Investment Type",
          "description": "...",          (optional)
          "values": ["Expansion", "New", "Modernization"]
        }
      ]
    }

    Rules:
    - master_definition: no duplicate by (name, tenant_id, project_id)
    - master_data: no duplicate by (master_id, data->>'name', tenant_id)
    """
    conn = get_connection()
    cur  = get_cursor(conn)

    try:
        tenant_id  = payload["tenant_id"]
        project_id = payload.get("project_id")
        masters    = payload.get("masters", [])

        total_defs   = 0
        total_values = 0

        for master in masters:
            name   = master["name"].strip()
            values = master.get("values", [])

            defn = _ensure_master_definition(
                cur, name, tenant_id, project_id,
                description=master.get("description"),
            )
            master_def_id   = defn["id"]
            master_def_code = defn["code"]
            total_defs += 1

            for item in values:
                # item can be a plain string or {"name": "...", "abbr": "...", ...}
                if isinstance(item, dict):
                    val       = str(item.get("name", "")).strip()
                    abbr      = item.get("abbr")
                    extra     = {k: v for k, v in item.items() if k not in ("name", "abbr")}
                else:
                    val, abbr, extra = str(item).strip(), None, {}

                if not val:
                    continue
                _ensure_master_data_row(
                    cur, master_def_id, master_def_code,
                    val, tenant_id, abbr=abbr, extra_data=extra or None,
                )
                total_values += 1

        conn.commit()
        return {
            "success": True,
            "definitions_processed": total_defs,
            "values_processed": total_values,
        }
        
    except Exception as e:
        conn.rollback()
        print(f"Error in insert_masters: {str(e)}")
        raise e
    finally:
        cur.close()
        conn.close()
