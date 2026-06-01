"""
Versioning Logic for Form Generate.

Flow:
  1. Check if form already exists for (department_id, service_id, form_type_id)
  2. If NOT exists → return action="INSERT_NEW", version="v1"
  3. If EXISTS → compare current form data with new AI-generated JSON
     a. No diff → return action="NO_CHANGE"
     b. Diff found → deactivate old form, return action="NEW_VERSION", version="v2"

Note on unique constraint:
  m_fb_form_mapping has UNIQUE(department_id, service_id, form_type_id).
  For versioning, we deactivate the old record and insert a new one.
  Since the unique constraint doesn't allow two rows with same keys,
  we UPDATE the existing record (bump version, update all child data).
"""
import json
from db import get_connection, get_cursor


def get_existing_form(department_id: int, service_id: str, form_type_id: int) -> dict | None:
    """Fetch existing form mapping + summary data."""
    conn = get_connection()
    cur  = get_cursor(conn)
    try:
        cur.execute(
            """SELECT id, form_name, form_code, form_version, is_active
               FROM m_fb_form_mapping
               WHERE department_id = %s AND service_id = %s AND form_type_id = %s""",
            (department_id, service_id, form_type_id)
        )
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()


def _fetch_current_form_snapshot(service_id: str, form_type_id: int) -> dict:
    """
    Fetch complete snapshot of existing form for diff comparison.
    Uses service_id + form_type_id because child tables store form_id = form_type_id.
    """
    conn = get_connection()
    cur  = get_cursor(conn)
    try:
        # Pages
        cur.execute(
            "SELECT page_name, name_in_hindi, preference FROM m_fb_page_master "
            "WHERE service_id = %s AND form_id = %s AND is_active = 'Y' ORDER BY preference",
            (service_id, form_type_id)
        )
        pages = [dict(r) for r in cur.fetchall()]

        # Builder fields (with their form field names)
        cur.execute(
            """SELECT bf.preference, bf.input_type, bf.custom_label, bf.grid_span,
                      bf.is_required, bf.min_length, bf.max_length, bf.pattern,
                      ff.name AS field_name
               FROM m_fb_form_builder_fields bf
               JOIN m_fb_form_field ff ON ff.id = bf.form_field_id
               WHERE bf.service_id = %s AND bf.form_id = %s AND bf.is_active = 'Y'
               ORDER BY bf.page_id, bf.category_id, bf.preference""",
            (service_id, form_type_id)
        )
        fields = [dict(r) for r in cur.fetchall()]

        # Options
        cur.execute(
            """SELECT opt.static_options, opt.source_type
               FROM m_fb_formfield_options opt
               JOIN m_fb_form_builder_fields bf ON bf.id = opt.builder_field_id
               WHERE bf.service_id = %s AND bf.form_id = %s AND opt.is_active = 'Y'""",
            (service_id, form_type_id)
        )
        options = [dict(r) for r in cur.fetchall()]

        # Rules
        cur.execute(
            "SELECT scope, when_json, then_json FROM m_fb_form_rules "
            "WHERE service_id = %s AND form_id = %s AND is_active = 'Y'",
            (service_id, form_type_id)
        )
        rules = [dict(r) for r in cur.fetchall()]

        return {
            "pages":   pages,
            "fields":  fields,
            "options": options,
            "rules":   rules,
        }
    finally:
        cur.close()
        conn.close()


def _normalise_new_json(payload: dict) -> dict:
    """
    Normalise the AI-generated JSON to same shape as snapshot for comparison.
    """
    pages  = [{"page_name": p["page_name"],
               "name_in_hindi": p.get("name_in_hindi"),
               "preference": p.get("preference", i + 1)}
              for i, p in enumerate(payload.get("page_masters", []))]

    fields = [{"field_name": f["name"] if f["action"] == "INSERT_NEW" else f.get("name", ""),
               "input_type": None,  # resolved from builder_fields below
               "custom_label": None,
               "grid_span": None,
               "is_required": None,
               "min_length": None,
               "max_length": None,
               "pattern": None,
               "preference": None}
              for f in payload.get("form_fields", [])]

    # Enrich from builder_fields
    field_ref_to_info = {
        bf["field_ref"]: bf for bf in payload.get("builder_fields", [])
    }
    # Map form_field ref → name
    ff_ref_to_name = {}
    for ff in payload.get("form_fields", []):
        ff_ref_to_name[ff["ref"]] = ff.get("name", ff.get("existing_id", ""))

    enriched_fields = []
    for bf in payload.get("builder_fields", []):
        enriched_fields.append({
            "field_name":  ff_ref_to_name.get(bf["field_ref"], ""),
            "input_type":  bf.get("input_type"),
            "custom_label": bf.get("custom_label"),
            "grid_span":   bf.get("grid_span", 6),
            "is_required": bf.get("is_required", "N"),
            "min_length":  bf.get("min_length"),
            "max_length":  bf.get("max_length"),
            "pattern":     bf.get("pattern"),
            "preference":  bf.get("preference", 1),
        })

    options = [{"static_options": json.dumps(opt.get("static_options")),
                "source_type": opt.get("source_type", "STATIC")}
               for opt in payload.get("field_options", [])]

    rules = [{"scope": r.get("scope", "field"),
              "when_json": json.dumps(r.get("when_json", {})),
              "then_json": json.dumps(r.get("then_json", {}))}
             for r in payload.get("form_rules", [])]

    return {
        "pages":   pages,
        "fields":  enriched_fields,
        "options": options,
        "rules":   rules,
    }


def _compute_diff(old: dict, new: dict) -> list[str]:
    """
    Compare old snapshot vs new JSON.
    Returns list of human-readable change descriptions.
    Empty list = no changes.
    """
    changes = []

    # Compare page count / names
    old_page_names = sorted(p["page_name"] for p in old["pages"])
    new_page_names = sorted(p["page_name"] for p in new["pages"])
    if old_page_names != new_page_names:
        changes.append(f"Pages changed: {old_page_names} → {new_page_names}")

    # Compare field names
    old_field_names = sorted(f["field_name"] for f in old["fields"])
    new_field_names = sorted(f["field_name"] for f in new["fields"])
    if old_field_names != new_field_names:
        added   = set(new_field_names) - set(old_field_names)
        removed = set(old_field_names) - set(new_field_names)
        if added:
            changes.append(f"New fields added: {sorted(added)}")
        if removed:
            changes.append(f"Fields removed: {sorted(removed)}")

    # Compare field config for common fields
    old_field_map = {f["field_name"]: f for f in old["fields"]}
    new_field_map = {f["field_name"]: f for f in new["fields"]}
    for fname in set(old_field_map) & set(new_field_map):
        o = old_field_map[fname]
        n = new_field_map[fname]
        diffs = []
        for key in ("input_type", "is_required", "min_length", "max_length", "pattern"):
            ov = str(o.get(key)) if o.get(key) is not None else None
            nv = str(n.get(key)) if n.get(key) is not None else None
            if ov != nv:
                diffs.append(f"{key}: {ov}→{nv}")
        if diffs:
            changes.append(f"Field '{fname}' changed: {', '.join(diffs)}")

    # Compare options count
    if len(old["options"]) != len(new["options"]):
        changes.append(
            f"Options count changed: {len(old['options'])} → {len(new['options'])}"
        )

    # Compare rules count
    if len(old["rules"]) != len(new["rules"]):
        changes.append(
            f"Rules count changed: {len(old['rules'])} → {len(new['rules'])}"
        )

    return changes


def _next_version(current_version: str | None) -> str:
    """'v1' → 'v2', 'v3' → 'v4', None → 'v1'"""
    if not current_version:
        return "v1"
    try:
        num = int(current_version.lstrip("v"))
        return f"v{num + 1}"
    except ValueError:
        return "v2"


def deactivate_old_form(mapping_id: int, service_id: str, form_type_id: int):
    """Set old form mapping and all its children to is_active='N'."""
    conn = get_connection()
    cur  = get_cursor(conn)
    try:
        cur.execute("UPDATE m_fb_form_mapping SET is_active='N' WHERE id=%s", (mapping_id,))
        cur.execute(
            "UPDATE m_fb_page_master SET is_active='N' WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        cur.execute(
            "UPDATE m_fb_form_builder_fields SET is_active='N' WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        cur.execute(
            """UPDATE m_fb_formfield_options SET is_active='N'
               WHERE builder_field_id IN (
                   SELECT id FROM m_fb_form_builder_fields
                   WHERE service_id=%s AND form_id=%s
               )""",
            (service_id, form_type_id)
        )
        cur.execute(
            "UPDATE m_fb_form_rules SET is_active='N' WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        cur.execute(
            "UPDATE m_fb_addmore_groups SET is_active='N' WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def delete_old_form(mapping_id: int, service_id: str, form_type_id: int):
    """
    Hard-delete old form data so a fresh INSERT can proceed.
    Required when force_new_version=True — deactivate alone cannot release the
    UNIQUE(department_id, service_id, form_type_id) constraint on m_fb_form_mapping.
    Delete in reverse FK dependency order.
    """
    conn = get_connection()
    cur  = get_cursor(conn)
    try:
        # 1. addmore_columns → references builder_field_id
        cur.execute(
            """DELETE FROM m_fb_addmore_columns
               WHERE builder_field_id IN (
                   SELECT id FROM m_fb_form_builder_fields
                   WHERE service_id=%s AND form_id=%s
               )""",
            (service_id, form_type_id)
        )
        # 2. formfield_options → references builder_field_id
        cur.execute(
            """DELETE FROM m_fb_formfield_options
               WHERE builder_field_id IN (
                   SELECT id FROM m_fb_form_builder_fields
                   WHERE service_id=%s AND form_id=%s
               )""",
            (service_id, form_type_id)
        )
        # 3. addmore_groups → references service_id + form_id
        cur.execute(
            "DELETE FROM m_fb_addmore_groups WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        # 4. builder_fields
        cur.execute(
            "DELETE FROM m_fb_form_builder_fields WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        # 5. page_category_mapping → references page_id
        cur.execute(
            """DELETE FROM m_fb_page_category_mapping
               WHERE page_id IN (
                   SELECT id FROM m_fb_page_master
                   WHERE service_id=%s AND form_id=%s
               )""",
            (service_id, form_type_id)
        )
        # 6. page_master
        cur.execute(
            "DELETE FROM m_fb_page_master WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        # 7. form_rules
        cur.execute(
            "DELETE FROM m_fb_form_rules WHERE service_id=%s AND form_id=%s",
            (service_id, form_type_id)
        )
        # 8. form_mapping (unique constraint row — must be last)
        cur.execute("DELETE FROM m_fb_form_mapping WHERE id=%s", (mapping_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def check_version(
    department_id: int,
    service_id: str,
    form_type_id: int,
    new_payload: dict,
) -> dict:
    """
    Main versioning entry point. Returns:
    {
      "action":  "INSERT_NEW" | "NEW_VERSION" | "NO_CHANGE",
      "version": "v1" | "v2" | ...,
      "changes": [...],           # list of change descriptions
      "old_mapping_id": int|None  # existing mapping id if found
    }
    """
    existing = get_existing_form(department_id, service_id, form_type_id)

    if not existing:
        return {
            "action":         "INSERT_NEW",
            "version":        "v1",
            "changes":        [],
            "old_mapping_id": None,
        }

    # Fetch current form data and compare
    old_snapshot  = _fetch_current_form_snapshot(service_id, form_type_id)
    new_normalised = _normalise_new_json(new_payload)
    changes        = _compute_diff(old_snapshot, new_normalised)

    if not changes:
        return {
            "action":         "NO_CHANGE",
            "version":        existing["form_version"],
            "changes":        [],
            "old_mapping_id": existing["id"],
        }

    next_ver = _next_version(existing.get("form_version"))
    return {
        "action":         "NEW_VERSION",
        "version":        next_ver,
        "changes":        changes,
        "old_mapping_id": existing["id"],
    }
