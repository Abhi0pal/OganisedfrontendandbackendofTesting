"""
FormBuilder JSON Auto-Fixer
Automatically fixes common AI generation mistakes before validation & DB insert.

Fixes applied:
1. "null" string → null (JSON null)
2. max_length: 0 → null
3. min_length: 0 → null
4. builder_fields: add missing required keys (input_type, custom_label, grid_span, is_required, validation_rule, layout_type, etc.)
5. form_fields INSERT_NEW: add missing is_editable, is_active, category_ref (if derivable)
6. categories INSERT_NEW: add missing is_active: true
7. addmore_groups: [[], []] → [] (fix array-of-arrays bug)
8. page_masters/page_category_mappings: name_in_hindi/help_text "null" → null
9. field_options source_type=MASTER: clear static_options → null
10. select/radio/checkbox/multiselect missing field_options: add placeholder STATIC entry
11. field_options invalid source_type (e.g. "USE_EXISTING"): coerce to STATIC or MASTER
12. page_masters empty: create deterministic fallback pages from categories
"""


def _fix_null_strings(obj):
    """Recursively replace string "null" with JSON null."""
    if isinstance(obj, dict):
        return {k: _fix_null_strings(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_fix_null_strings(v) for v in obj]
    if obj == "null":
        return None
    return obj


def fix_generated_json(data: dict) -> tuple[dict, list[str]]:
    """
    Auto-fix common AI JSON mistakes.
    Returns: (fixed_data, list_of_fixes_applied)
    """
    fixes = []
    data = dict(data)  # shallow copy at root

    # ── Fix 1: Replace all "null" strings with JSON null ──────────────────────
    fixed = _fix_null_strings(data)
    if fixed != data:
        fixes.append('Replaced all "null" strings with JSON null')
    data = fixed

    # ── Fix 2: Ensure all 10 root keys exist ──────────────────────────────────
    for key in ["categories", "form_fields", "page_masters", "page_category_mappings",
                "builder_fields", "field_options", "addmore_groups", "addmore_columns",
                "form_rules"]:
        if key not in data:
            data[key] = []
            fixes.append(f"Added missing root key: {key}: []")

    # Fix 2b: If the model omits page_masters entirely, derive a usable page
    # structure from categories so validation/insert is not blocked.
    if not isinstance(data.get("page_masters"), list):
        data["page_masters"] = []
        fixes.append("page_masters was not an array - replaced with []")
    if not isinstance(data.get("page_category_mappings"), list):
        data["page_category_mappings"] = []
        fixes.append("page_category_mappings was not an array - replaced with []")

    if len(data.get("page_masters", [])) == 0:
        category_rows = [
            c for c in data.get("categories", [])
            if isinstance(c, dict) and c.get("ref")
        ]
        if category_rows:
            data["page_masters"] = []
            data["page_category_mappings"] = []
            for idx, cat in enumerate(category_rows, 1):
                page_ref = f"$P{idx}"
                page_name = (
                    cat.get("category_name")
                    or cat.get("name")
                    or cat.get("name_in_hindi")
                    or f"Page {idx}"
                )
                data["page_masters"].append({
                    "ref": page_ref,
                    "page_name": str(page_name),
                    "name_in_hindi": cat.get("name_in_hindi"),
                    "preference": idx,
                })
                data["page_category_mappings"].append({
                    "page_ref": page_ref,
                    "category_ref": cat["ref"],
                    "preference": idx,
                    "help_text": None,
                })
            fixes.append(
                f"page_masters was empty - created {len(category_rows)} fallback page(s) from categories"
            )
        elif data.get("form_fields"):
            data["page_masters"] = [{
                "ref": "$P1",
                "page_name": "Application Details",
                "name_in_hindi": None,
                "preference": 1,
            }]
            fixes.append("page_masters was empty - created fallback page $P1")

    # ── Fix 3a: Detect AI output truncation ────────────────────────────────────
    bf_count = len(data.get("builder_fields", []))
    ff_count = len(data.get("form_fields", []))
    if ff_count > 0 and bf_count < ff_count:
        missing = ff_count - bf_count
        fixes.append(
            f"TRUNCATION DETECTED: Only {bf_count}/{ff_count} builder_fields were generated. "
            f"{missing} fields are missing. Regenerate the form — the AI hit its output token limit."
        )

    # ── Fix 3: addmore_groups — remove empty arrays [[], [], ...] ─────────────
    ag = data.get("addmore_groups", [])
    if isinstance(ag, list) and ag and all(isinstance(x, list) for x in ag):
        data["addmore_groups"] = []
        data["addmore_columns"] = []
        fixes.append("Fixed addmore_groups: was array-of-arrays, replaced with []")

    # ── Fix 3b: Deduplicate builder_fields by field_ref ───────────────────────
    # Continuation pass can sometimes produce duplicates — keep first occurrence
    seen_field_refs = {}
    deduped_bfs = []
    for bf in data.get("builder_fields", []):
        if not isinstance(bf, dict):
            continue
        fr = bf.get("field_ref")
        if fr and fr in seen_field_refs:
            fixes.append(f"builder_field {bf.get('ref','?')}: removed duplicate (field_ref {fr} already covered by {seen_field_refs[fr]})")
        else:
            if fr:
                seen_field_refs[fr] = bf.get("ref", "?")
            deduped_bfs.append(bf)
    data["builder_fields"] = deduped_bfs

    # ── Fix 4: builder_fields — add missing keys ───────────────────────────────
    # Build lookup tables from existing data for deriving missing structural keys
    field_ref_to_name = {}
    field_ref_to_cat  = {}
    for ff in data.get("form_fields", []):
        if isinstance(ff, dict) and ff.get("ref"):
            if ff.get("name"):
                field_ref_to_name[ff["ref"]] = ff["name"]
            if ff.get("category_ref"):
                field_ref_to_cat[ff["ref"]] = ff["category_ref"]

    # category_ref → page_ref from page_category_mappings
    cat_to_page = {}
    for pcm in data.get("page_category_mappings", []):
        if isinstance(pcm, dict) and pcm.get("category_ref") and pcm.get("page_ref"):
            cat_to_page[pcm["category_ref"]] = pcm["page_ref"]
    valid_page_refs = {
        pm.get("ref")
        for pm in data.get("page_masters", [])
        if isinstance(pm, dict) and pm.get("ref")
    }

    # Current max preference per category_ref
    pref_counter = {}
    for bf in data.get("builder_fields", []):
        if isinstance(bf, dict):
            cr = bf.get("category_ref", "")
            p  = bf.get("preference", 0)
            if isinstance(p, int):
                pref_counter[cr] = max(pref_counter.get(cr, 0), p)

    bf_defaults = {
        "input_type": "text",
        "custom_label": "",
        "grid_span": 6,
        "is_required": "N",
        "min_length": None,
        "max_length": None,
        "validation_rule": None,
        "layout_type": None,
        "placeholder": None,
        "help_text": None,
        "pattern": None,
        "is_readonly": "N",
        "is_editable": "Y",
        "is_active": "Y",
    }
    null_to_none_keys = {"min_length", "max_length"}

    for bf in data.get("builder_fields", []):
        if not isinstance(bf, dict):
            continue
        ref = bf.get("ref", "?")

        # ── Derive structural keys if missing ──────────────────────────────────
        # category_ref: derive from form_field's category_ref
        if "category_ref" not in bf or not bf.get("category_ref"):
            derived_cat = field_ref_to_cat.get(bf.get("field_ref", ""))
            if derived_cat:
                bf["category_ref"] = derived_cat
                fixes.append(f"builder_field {ref}: derived category_ref: {derived_cat}")
            else:
                # fallback: use first category
                first_cat = data["categories"][0]["ref"] if data.get("categories") else "$C1"
                bf["category_ref"] = first_cat
                fixes.append(f"builder_field {ref}: category_ref set to fallback {first_cat}")

        # page_ref: derive from category_ref via page_category_mappings
        if "page_ref" not in bf or not bf.get("page_ref"):
            derived_page = cat_to_page.get(bf.get("category_ref", ""))
            if derived_page:
                bf["page_ref"] = derived_page
                fixes.append(f"builder_field {ref}: derived page_ref: {derived_page}")
            else:
                first_page = data["page_masters"][0]["ref"] if data.get("page_masters") else "$P1"
                bf["page_ref"] = first_page
                fixes.append(f"builder_field {ref}: page_ref set to fallback {first_page}")
        elif valid_page_refs and bf.get("page_ref") not in valid_page_refs:
            derived_page = cat_to_page.get(bf.get("category_ref", ""))
            fallback_page = derived_page or next(iter(valid_page_refs))
            old_page = bf.get("page_ref")
            bf["page_ref"] = fallback_page
            fixes.append(f"builder_field {ref}: invalid page_ref {old_page} -> {fallback_page}")

        # field_ref: should already exist, but guard
        if "field_ref" not in bf or not bf.get("field_ref"):
            bf["field_ref"] = ref.replace("$BF", "$F")
            fixes.append(f"builder_field {ref}: inferred field_ref: {bf['field_ref']}")

        # preference: derive as max + 1 for this category
        if "preference" not in bf or not isinstance(bf.get("preference"), int):
            cr = bf.get("category_ref", "")
            pref_counter[cr] = pref_counter.get(cr, 0) + 1
            bf["preference"] = pref_counter[cr]
            fixes.append(f"builder_field {ref}: set preference: {bf['preference']}")

        # ── Apply scalar defaults for remaining keys ───────────────────────────
        for key, default in bf_defaults.items():
            if key not in bf:
                if key == "custom_label":
                    derived_label = field_ref_to_name.get(bf.get("field_ref", ""), "")
                    bf[key] = derived_label if derived_label else default
                else:
                    bf[key] = default
                fixes.append(f"builder_field {ref}: added missing {key}: {bf[key]!r}")

        # Fix max_length/min_length = 0 → null
        for key in null_to_none_keys:
            if bf.get(key) == 0:
                bf[key] = None
                fixes.append(f"builder_field {ref}: {key} 0 → null")

    # ── Fix 5: form_fields INSERT_NEW — add missing keys ──────────────────────
    # Build category_ref lookup from builder_fields (field_ref → category_ref)
    field_to_cat = {}
    for bf in data.get("builder_fields", []):
        if isinstance(bf, dict):
            fr = bf.get("field_ref")
            cr = bf.get("category_ref")
            if fr and cr:
                field_to_cat[fr] = cr

    for ff in data.get("form_fields", []):
        if not isinstance(ff, dict) or ff.get("action") != "INSERT_NEW":
            continue
        ref = ff.get("ref", "?")
        if "is_editable" not in ff:
            ff["is_editable"] = "Y"
            fixes.append(f"form_field {ref}: added missing is_editable: Y")
        if "is_active" not in ff:
            ff["is_active"] = True
            fixes.append(f"form_field {ref}: added missing is_active: true")
        if "category_ref" not in ff:
            # Try to derive from builder_fields
            derived = field_to_cat.get(ref)
            if derived:
                ff["category_ref"] = derived
                fixes.append(f"form_field {ref}: derived category_ref: {derived}")
            else:
                ff["category_ref"] = None
                fixes.append(f"form_field {ref}: added category_ref: null (could not derive)")
        if "name_in_hindi" not in ff:
            ff["name_in_hindi"] = None

    # ── Fix 6: categories INSERT_NEW — add missing keys ───────────────────────
    for cat in data.get("categories", []):
        if not isinstance(cat, dict) or cat.get("action") != "INSERT_NEW":
            continue
        ref = cat.get("ref", "?")
        if "is_active" not in cat:
            cat["is_active"] = True
            fixes.append(f"category {ref}: added missing is_active: true")
        if "parent_id" not in cat:
            cat["parent_id"] = 0
        if "name_in_hindi" not in cat:
            cat["name_in_hindi"] = None

    # ── Fix 7: page_masters — ensure name_in_hindi exists ─────────────────────
    for pm in data.get("page_masters", []):
        if not isinstance(pm, dict):
            continue
        if "name_in_hindi" not in pm:
            pm["name_in_hindi"] = None

    # ── Fix 8: page_category_mappings — ensure help_text exists ───────────────
    for pcm in data.get("page_category_mappings", []):
        if not isinstance(pcm, dict):
            continue
        if "help_text" not in pcm:
            pcm["help_text"] = None

    # ── Fix 9: field_options — ensure required keys exist ─────────────────────
    VALID_SOURCE_TYPES = {"STATIC", "MASTER"}
    fo_refs = set()
    for fo in data.get("field_options", []):
        if not isinstance(fo, dict):
            continue
        fo_refs.add(fo.get("builder_field_ref"))
        if "master_table_id" not in fo:
            fo["master_table_id"] = None
        if "parent_builder_field_ref" not in fo:
            fo["parent_builder_field_ref"] = None

        # Fix: invalid source_type values (e.g. "USE_EXISTING") → coerce to valid enum
        st = fo.get("source_type")
        if st not in VALID_SOURCE_TYPES:
            has_master = fo.get("master_table_id") not in (None, 0, "null")
            new_st = "MASTER" if has_master else "STATIC"
            fo["source_type"] = new_st
            fixes.append(
                f"field_options for {fo.get('builder_field_ref', '?')}: "
                f"invalid source_type {st!r} → {new_st}"
            )

        # Fix: source_type=MASTER with no master_table_id but has static_options → switch to STATIC
        if fo.get("source_type") == "MASTER":
            has_static = fo.get("static_options") not in (None, [], "null")
            has_master = fo.get("master_table_id") not in (None, 0, "null")
            if has_static and not has_master:
                # AI wrote MASTER but gave static options and no master table — use STATIC
                fo["source_type"] = "STATIC"
                fixes.append(
                    f"field_options for {fo.get('builder_field_ref', '?')}: "
                    f"source_type MASTER→STATIC (had static_options but no master_table_id)"
                )
            elif not has_static:
                # True MASTER with no static options — ensure static_options is null
                fo["static_options"] = None

    # ── Fix 10: select/radio/checkbox/multiselect missing field_options entry ──
    select_types = {"select", "radio", "checkbox", "multiselect"}
    for bf in data.get("builder_fields", []):
        if not isinstance(bf, dict):
            continue
        if bf.get("input_type") in select_types and bf.get("ref") not in fo_refs:
            # Add a placeholder STATIC entry so validation passes
            placeholder = {
                "builder_field_ref": bf["ref"],
                "source_type": "STATIC",
                "static_options": [{"label": "Option 1", "value": "option_1"}],
                "master_table_id": None,
                "parent_builder_field_ref": None,
            }
            data["field_options"].append(placeholder)
            fixes.append(
                f"field_options for {bf['ref']} ({bf.get('input_type')}): "
                f"added placeholder STATIC entry — replace with real options"
            )

    # ── Fix 11: auto-map categories missing from page_category_mappings ──────────
    pcm_list      = data.get("page_category_mappings", [])
    page_masters  = data.get("page_masters", [])
    mapped_refs   = {m.get("category_ref") for m in pcm_list if isinstance(m, dict)}
    all_cat_refs  = [c.get("ref") for c in data.get("categories", []) if isinstance(c, dict) and c.get("ref")]
    unmapped      = [r for r in all_cat_refs if r not in mapped_refs]

    if unmapped and page_masters:
        # pick the last page as fallback target
        last_page_ref = None
        for pm in reversed(page_masters):
            if isinstance(pm, dict) and pm.get("ref"):
                last_page_ref = pm["ref"]
                break
        if last_page_ref:
            for cat_ref in unmapped:
                pcm_list.append({
                    "page_ref":    last_page_ref,
                    "category_ref": cat_ref,
                    "help_text":   None,
                })
                fixes.append(
                    f"page_category_mappings: {cat_ref} was unmapped → auto-assigned to {last_page_ref}"
                )
            data["page_category_mappings"] = pcm_list

    return data, fixes
