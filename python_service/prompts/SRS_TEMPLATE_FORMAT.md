# SRS Template Format Guide
# This file explains the IDEAL format for SRS documents to generate perfect FormBuilder JSON.
# Use this as reference when writing new SRS documents.

## FORMAT RULES:
1. Start with FORM METADATA block
2. Each PAGE must be clearly labeled
3. Each SECTION must be clearly labeled under the page
4. Each FIELD must have: Name | Type | Mandatory | Validation/Notes
5. CONDITIONAL RULES must be clearly stated at the end of each section
6. Use English only for labels. Hindi names can be added in brackets.

## EXAMPLE TEMPLATE:
---
FORM METADATA
Form Name: <Full Form Name>
Department ID: <number>
Service ID: <like 1.0 or 591.0>
Form Type ID: <1=New Application, 2=Renewal, 3=Amendment>

PAGE 1: <Page Name>
  SECTION: <Section Name>
    FIELD: <Field Name> | TYPE: text/select/radio/checkbox/date/tel/email/textarea/file/number | MANDATORY: Yes/No/Conditional | <validation notes>
    ...
  CONDITIONAL RULES:
    - Show <Field Name> only when <Other Field Name> = <value>
    ...

PAGE 2: <Page Name>
  ...
---


JSON SCHEMA:

"""Strict JSON schema enforced by Gemini — prevents type errors in DB insert."""
    return {
        "type": "object",
        "properties": {
            "meta": {
                "type": "object",
                "properties": {
                    "department_id": {"type": "integer"},
                    "service_id":    {"type": "string"},
                    "form_type_id":  {"type": "integer"},
                    "form_name":     {"type": "string"},
                },
                "required": ["department_id", "service_id", "form_type_id", "form_name"],
            },
            "categories": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref":           {"type": "string"},
                        "action":        {"type": "string", "enum": ["INSERT_NEW", "USE_EXISTING"]},
                        "existing_id":   {"type": "integer"},
                        "category_name": {"type": "string"},
                        "name_in_hindi": {"type": "string"},
                        "parent_id":     {"type": "integer"},
                        "is_active":     {"type": "boolean"},
                    },
                    "required": ["ref", "action", "category_name"],
                },
            },
            "form_fields": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref":          {"type": "string"},
                        "action":       {"type": "string", "enum": ["INSERT_NEW", "USE_EXISTING"]},
                        "existing_id":  {"type": "integer"},
                        "name":         {"type": "string"},
                        "name_in_hindi":{"type": "string"},
                        "category_ref": {"type": "string"},
                        "is_editable":  {"type": "string", "enum": ["Y", "N"]},
                        "is_active":    {"type": "boolean"},
                    },
                    "required": ["ref", "action", "name"],
                },
            },
            "page_masters": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref":          {"type": "string"},
                        "page_name":    {"type": "string"},
                        "name_in_hindi":{"type": "string"},
                        "preference":   {"type": "integer"},
                    },
                    "required": ["ref", "page_name", "preference"],
                },
            },
            "page_category_mappings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "page_ref":     {"type": "string"},
                        "category_ref": {"type": "string"},
                        "preference":   {"type": "integer"},
                        "help_text":    {"type": "string"},
                    },
                    "required": ["page_ref", "category_ref", "preference"],
                },
            },
            "builder_fields": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref":          {"type": "string"},
                        "page_ref":     {"type": "string"},
                        "category_ref": {"type": "string"},
                        "field_ref":    {"type": "string"},
                        "preference":   {"type": "integer"},
                        "input_type":   {"type": "string", "enum": ["text","number","select","date","radio","checkbox","textarea","file","tel","email","hidden","multiselect","datetime-local"]},
                        "custom_label": {"type": "string"},
                        "placeholder":  {"type": "string"},
                        "help_text":    {"type": "string"},
                        "grid_span":    {"type": "integer"},
                        "is_required":  {"type": "string", "enum": ["Y", "N"]},
                        "is_readonly":  {"type": "string", "enum": ["Y", "N"]},
                        "is_editable":  {"type": "string", "enum": ["Y", "N"]},
                        "is_active":    {"type": "string", "enum": ["Y", "N"]},
                        "min_length":   {"type": "integer"},
                        "max_length":   {"type": "integer"},
                        "pattern":      {"type": "string"},
                    },
                    "required": ["ref", "page_ref", "category_ref", "field_ref", "preference", "input_type", "is_required", "is_active"],
                },
            },
            "field_options": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "builder_field_ref":        {"type": "string"},
                        "source_type":              {"type": "string", "enum": ["STATIC", "MASTER"]},
                        "static_options": {
                            "type": "array",
                            "description": "REAL options extracted from SRS document. NEVER use placeholder values like 'Option 1'. Each label must be the actual option text from SRS; value must be lowercase_snake_case.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "label": {"type": "string", "description": "Actual option text from SRS document (e.g. 'New Project', 'Manufacturing', 'Yes')"},
                                    "value": {"type": "string", "description": "Lowercase snake_case of label (e.g. 'new_project', 'manufacturing', 'yes')"},
                                },
                                "required": ["label", "value"],
                            },
                        },
                        "master_table_id":          {"type": "integer"},
                        "parent_builder_field_ref": {"type": "string"},
                    },
                    "required": ["builder_field_ref", "source_type"],
                },
            },
            "addmore_groups": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref":                       {"type": "string"},
                        "page_ref":                  {"type": "string"},
                        "category_ref":              {"type": "string"},
                        "trigger_builder_field_ref": {"type": "string"},
                        "label":                     {"type": "string"},
                        "min_rows":                  {"type": "integer"},
                        "max_rows":                  {"type": "integer"},
                    },
                    "required": ["ref", "page_ref", "category_ref", "trigger_builder_field_ref", "label"],
                },
            },
            "addmore_columns": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "group_ref":         {"type": "string"},
                        "builder_field_ref": {"type": "string"},
                        "col_order":         {"type": "integer"},
                    },
                    "required": ["group_ref", "builder_field_ref", "col_order"],
                },
            },
            "form_rules": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "scope": {
                            "type": "string",
                            "enum": ["field", "page", "form"],
                        },
                        "when_json": {
                            "type": "object",
                            "properties": {
                                "field_ref":  {"type": "string"},
                                "operator":   {"type": "string"},
                                "value":      {"type": "string"},
                            },
                            "required": ["field_ref", "operator", "value"],
                        },
                        "then_json": {
                            "type": "object",
                            "properties": {
                                "action":      {"type": "string"},
                                "target_refs": {"type": "array", "items": {"type": "string"}},
                            },
                            "required": ["action", "target_refs"],
                        },
                    },
                    "required": ["scope", "when_json", "then_json"],
                },
            },
        },
        "required": ["meta", "categories", "form_fields", "page_masters",
                     "page_category_mappings", "builder_fields",
                     "field_options", "addmore_groups", "addmore_columns", "form_rules"],
    }
