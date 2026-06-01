"""
FormBuilder JSON Validator
Validates AI-generated JSON before DB insert.

Import: from validate_json import validate_generated_json
CLI:    python validate_json.py <json_file>
"""
import json
import sys
from pathlib import Path

REQUIRED_ROOT_KEYS = [
    "meta", "categories", "form_fields", "page_masters",
    "page_category_mappings", "builder_fields", "field_options",
    "addmore_groups", "addmore_columns", "form_rules"
]

REQUIRED_BF_KEYS = [
    "ref", "page_ref", "category_ref", "field_ref", "preference",
    "input_type", "custom_label", "placeholder", "help_text", "grid_span",
    "is_required", "is_readonly", "is_editable", "is_active",
    "min_length", "max_length", "pattern", "validation_rule", "layout_type"
]

REQUIRED_FF_INSERT_KEYS = ["ref", "action", "name", "name_in_hindi", "category_ref", "is_editable", "is_active"]
REQUIRED_CAT_INSERT_KEYS = ["ref", "action", "category_name", "name_in_hindi", "parent_id", "is_active"]

VALID_INPUT_TYPES = {
    "text", "number", "select", "date", "radio", "checkbox",
    "textarea", "file", "tel", "email", "hidden", "multiselect", "datetime-local",
    "button"
}

errors   = []
warnings = []


def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)


def check_no_string_null(obj, path="root"):
    """Recursively check for string "null" values."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if v == "null":
                err(f'String "null" found at {path}.{k} - must be JSON null')
            else:
                check_no_string_null(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            check_no_string_null(v, f"{path}[{i}]")


def validate(data: dict, silent: bool = False):
    # ── Root keys ──────────────────────────────────────────────────────────────
    for k in REQUIRED_ROOT_KEYS:
        if k not in data:
            err(f"Missing root key: '{k}'")

    # ── String "null" check ────────────────────────────────────────────────────
    check_no_string_null(data)

    meta = data.get("meta", {})
    categories    = data.get("categories", [])
    form_fields   = data.get("form_fields", [])
    page_masters  = data.get("page_masters", [])
    pcm           = data.get("page_category_mappings", [])
    builder_fields= data.get("builder_fields", [])
    field_options = data.get("field_options", [])
    addmore_groups= data.get("addmore_groups", [])
    addmore_cols  = data.get("addmore_columns", [])
    form_rules    = data.get("form_rules", [])

    # ── addmore_groups: must be list of dicts, not list of lists ───────────────
    if isinstance(addmore_groups, list):
        for i, ag in enumerate(addmore_groups):
            if isinstance(ag, list):
                err(f"addmore_groups[{i}] is an array - must be an object or addmore_groups must be []")
            elif not isinstance(ag, dict):
                err(f"addmore_groups[{i}] is not an object")
    else:
        err("addmore_groups must be an array")

    # ── addmore_columns: must be list of dicts ─────────────────────────────────
    if isinstance(addmore_cols, list):
        for i, ac in enumerate(addmore_cols):
            if isinstance(ac, list):
                err(f"addmore_columns[{i}] is an array - must be an object")

    # ── builder_fields count must match form_fields count ─────────────────────
    if len(builder_fields) != len(form_fields):
        missing = len(form_fields) - len(builder_fields)
        if missing > 0:
            err(
                f"AI OUTPUT TRUNCATED: builder_fields ({len(builder_fields)}) < form_fields ({len(form_fields)}) "
                f"- {missing} builder_fields were cut off mid-generation. "
                f"Regenerate the form (the model ran out of output tokens)."
            )
        else:
            err(f"builder_fields count ({len(builder_fields)}) != form_fields count ({len(form_fields)})")

    # ── builder_fields: all 19 keys must be present ───────────────────────────
    bf_refs = set()
    for i, bf in enumerate(builder_fields):
        ref = bf.get("ref", f"?[{i}]")
        bf_refs.add(ref)
        for k in REQUIRED_BF_KEYS:
            if k not in bf:
                err(f"builder_field {ref} missing key: '{k}'")
        # max_length / min_length must not be 0 (should be null)
        if bf.get("max_length") == 0:
            warn(f"builder_field {ref}: max_length is 0 - should be null if not specified")
        if bf.get("min_length") == 0:
            warn(f"builder_field {ref}: min_length is 0 - should be null if not specified")
        # input_type must be valid
        it = bf.get("input_type", "")
        if it not in VALID_INPUT_TYPES:
            err(f"builder_field {ref}: invalid input_type '{it}'")
        # validation_rule must be null or dict
        vr = bf.get("validation_rule")
        if vr is not None and not isinstance(vr, dict):
            err(f"builder_field {ref}: validation_rule must be null or JSON object, got {type(vr).__name__}")

    # ── form_fields: INSERT_NEW must have all required keys ───────────────────
    cat_refs = {c["ref"] for c in categories if isinstance(c, dict)}
    for i, ff in enumerate(form_fields):
        if not isinstance(ff, dict): continue
        if ff.get("action") == "INSERT_NEW":
            for k in REQUIRED_FF_INSERT_KEYS:
                if k not in ff:
                    err(f"form_field {ff.get('ref', f'?[{i}]')} (INSERT_NEW) missing key: '{k}'")
            if "category_ref" in ff and ff["category_ref"] is not None and ff["category_ref"] not in cat_refs:
                warn(f"form_field {ff.get('ref')} references unknown category_ref: {ff['category_ref']}")
            elif "category_ref" in ff and ff["category_ref"] is None:
                # Silently skip: None category_ref is set by json_fixer when builder_field was truncated
                pass

    # ── categories: INSERT_NEW must have all required keys ────────────────────
    for i, cat in enumerate(categories):
        if not isinstance(cat, dict): continue
        if cat.get("action") == "INSERT_NEW":
            for k in REQUIRED_CAT_INSERT_KEYS:
                if k not in cat:
                    err(f"category {cat.get('ref', f'?[{i}]')} (INSERT_NEW) missing key: '{k}'")

    # ── page_category_mappings: every category must be mapped ─────────────────
    mapped_cats = {m.get("category_ref") for m in pcm if isinstance(m, dict)}
    for cat in categories:
        if not isinstance(cat, dict): continue
        ref = cat.get("ref")
        if ref and ref not in mapped_cats:
            err(f"Category {ref} has no page_category_mapping entry")

    # ── field_options: all select/radio/multiselect/checkbox must have entry ──
    select_types = {"select", "radio", "multiselect", "checkbox"}
    has_options   = {fo.get("builder_field_ref") for fo in field_options if isinstance(fo, dict)}
    for bf in builder_fields:
        if not isinstance(bf, dict): continue
        if bf.get("input_type") in select_types:
            ref = bf.get("ref")
            if ref not in has_options:
                err(f"builder_field {ref} (input_type={bf.get('input_type')}) has no field_options entry")

    # ── field_options: STATIC must have static_options array ──────────────────
    for fo in field_options:
        if not isinstance(fo, dict): continue
        bfr = fo.get("builder_field_ref", "?")
        if fo.get("source_type") == "STATIC":
            if not isinstance(fo.get("static_options"), list):
                err(f"field_options for {bfr}: source_type=STATIC but static_options is not an array")
        elif fo.get("source_type") == "MASTER":
            if fo.get("static_options") is not None and fo.get("static_options") != "null":
                warn(f"field_options for {bfr}: source_type=MASTER but static_options is not null")

    # ── form_rules: warn if empty but SRS likely has conditional rules ─────────
    if len(form_rules) == 0:
        warn("form_rules is empty [] - if the SRS has CONDITIONAL RULES, they must be added here")

    # ── page_masters: must exist ───────────────────────────────────────────────
    if len(page_masters) == 0:
        err("page_masters is empty - at least one page must be defined")

    # ── Summary (only when running as CLI) ────────────────────────────────────
    if not silent:
        print(f"\n{'='*60}")
        print(f"  FormBuilder JSON Validation Report")
        print(f"{'='*60}")
        print(f"  meta.form_name  : {meta.get('form_name', '?')}")
        print(f"  meta.service_id : {meta.get('service_id', '?')}")
        print(f"  Pages           : {len(page_masters)}")
        print(f"  Categories      : {len(categories)}")
        print(f"  Form Fields     : {len(form_fields)}")
        print(f"  Builder Fields  : {len(builder_fields)}")
        print(f"  Field Options   : {len(field_options)}")
        print(f"  Addmore Groups  : {len([ag for ag in addmore_groups if isinstance(ag, dict)])}")
        print(f"  Addmore Columns : {len([ac for ac in addmore_cols if isinstance(ac, dict)])}")
        print(f"  Form Rules      : {len(form_rules)}")
        print(f"{'='*60}")

        if errors:
            print(f"\n  ERRORS ({len(errors)}) - JSON is NOT ready for DB insert:")
            for e in errors:
                print(e)
        else:
            print(f"\n  No errors found.")

        if warnings:
            print(f"\n  WARNINGS ({len(warnings)}):")
            for w in warnings:
                print(w)

        status = "VALID - ready for DB insert" if not errors else "INVALID - fix errors before insert"
        print(f"\n  Status: {status}")
        print(f"{'='*60}\n")

    return len(errors) == 0


def validate_generated_json(data: dict) -> dict:
    """
    Importable validator for use in main.py pipeline.
    Returns: { "is_valid": bool, "errors": [...], "warnings": [...], "stats": {...} }
    """
    global errors, warnings
    errors   = []
    warnings = []

    validate(data, silent=True)   # populates module-level errors/warnings lists, no stdout

    stats = {
        "pages":           len(data.get("page_masters", [])),
        "categories":      len(data.get("categories", [])),
        "form_fields":     len(data.get("form_fields", [])),
        "builder_fields":  len(data.get("builder_fields", [])),
        "field_options":   len(data.get("field_options", [])),
        "addmore_groups":  len([ag for ag in data.get("addmore_groups", []) if isinstance(ag, dict)]),
        "addmore_columns": len([ac for ac in data.get("addmore_columns", []) if isinstance(ac, dict)]),
        "form_rules":      len(data.get("form_rules", [])),
    }

    return {
        "is_valid": len(errors) == 0,
        "errors":   [e.strip() for e in errors],
        "warnings": [w.strip() for w in warnings],
        "stats":    stats,
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_json.py <path_to_json_file>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON syntax: {e}")
        sys.exit(1)

    ok = validate(data)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
