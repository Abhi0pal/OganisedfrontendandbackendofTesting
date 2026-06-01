export const schemeDefinitionsData = [
  {
    policy_id: 2,
    service_id: "964.0",
    scheme_name: "Capital Subsidy",
    scheme_code: "CAPITAL_SUBSIDY",

    cascading_config: {
      "groups": []
    },
    pop_message_config: {
      title: "Important Information",
      enabled: true,
      sections: [
        {
          type: "paragraph",
          heading: "h5",
          bold: true,
          italic: true,
          muted: false,
          content:
            "Please read the following instructions carefully before proceeding. Make sure to follow each step to avoid delays in your application.",
        },
        {
          type: "bullets",
          items: [
            "Applicant must be a resident of the state",
            "All documents must be valid and up-to-date",
            "One application per user is allowed",
            "Ensure correct details are filled in the form",
            "Double-check the bank account details",
            "Follow all instructions provided in the scheme guidelines",
          ],
        },
        {
          type: "table",
          headers: ["Document", "Mandatory"],
          rows: [
            ["Aadhaar Card", "Yes"],
            ["Bank Passbook", "Yes"],
            ["PAN Card", "Yes"],
            ["Income Certificate", "If applicable"],
          ],
        },
        {
          type: "documents",
          items: [
            "Project Report",
            "Identity Proof (Aadhaar / Passport)",
            "Address Proof (Utility Bill / Ration Card)",
            "Bank Account Proof",
            "PAN Card Copy",
          ],
        },
      ],
      acknowledgement_text:
        "I have read and understood the instructions",
    },

    form_structure_json: {
  "sections": [
    {
      "fields": [
        {
          "required": false,
          "field_code": "FIRST_NAME"
        },
        {
          "required": false,
          "field_code": "MIDDLE_NAME"
        },
        {
          "required": false,
          "field_code": "LAST_NAME"
        },
        {
          "required": false,
          "field_code": "GENDER",
          "description": "checking"
        }
      ],
      "grid_cols": 3,
      "description": "Fill your basic details",
      "step_number": 1,
      "section_title": "Applicant Details"
    },
    {
      "fields": [
        {
          "required": false,
          "field_code": "REPEATER_GROUP_1",
          "sub_fields": [
            {
              "required": true,
              "field_code": "INVESTMENT_AMOUNT"
            },
            {
              "required": true,
              "field_code": "INVESTMENT_DATE"
            }
          ],
          "is_repeater": true,
          "component_type": "repeater",
          "label_override": "Investments",
          "repeater_config": {
            "max_items": 10,
            "min_items": 0,
            "item_label": "Investments",
            "add_button_label": "Add Investments"
          }
        }
      ],
      "grid_cols": 2,
      "description": "",
      "step_number": 1,
      "section_title": "Investment Details"
    },
    {
      "fields": [
        {
          "required": false,
          "field_code": "ADDRESS_LINE_1"
        },
        {
          "required": false,
          "field_code": "ADDRESS_LINE_2"
        }
      ],
      "grid_cols": 2,
      "description": "",
      "step_number": 2,
      "section_title": "Address Section"
    },
    {
      "fields": [
        {
          "required": false,
          "field_code": "AADHAAR_NUMBER",
          "placeholder": "Checking for the placeholder",
          "label_override": "Aadhaar No."
        },
        {
          "required": false,
          "field_code": "PAN_NUMBER",
          "description": "Checking for the help text",
          "validation_override": {
            "message": "Wrong pan number",
            "pattern": "^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
          }
        }
      ],
      "condition": {
        "type": "group",
        "children": [
          {
            "type": "rule",
            "value": "Mouli",
            "operator": "equals",
            "field_code": "FIRST_NAME"
          },
          {
            "type": "group",
            "children": [
              {
                "type": "rule",
                "value": "Mitra",
                "operator": "equals",
                "field_code": "LAST_NAME"
              },
              {
                "type": "rule",
                "value": "Demo",
                "operator": "equals",
                "field_code": "MIDDLE_NAME"
              }
            ],
            "operator": "AND"
          }
        ],
        "operator": "OR"
      },
      "grid_cols": 2,
      "description": "",
      "step_number": 4,
      "section_title": "Identification Details"
    }
  ],
  "is_multi_step": true,
  "is_approved_caf_required": false
},

    required_documents: {},

    calculation_logic: {},

    workflow_config: {
  "stages": [
    {
      "action": [
        "revert_applicant",
        "forward",
        "reject"
      ],
      "next_role": [
        "4"
      ],
      "stage_name": "Demo",
      "role_assign": "Document Verifier",
      "current_role": "2",
      "timeline_days": 3
    },
    {
      "action": [
        "forward",
        "reject"
      ],
      "next_role": [
        "1"
      ],
      "stage_name": "Demo 2",
      "current_role": "4",
      "timeline_days": 3
    }
  ],
  "submit_url": "",
  "is_multi_step": true
    },

    admin_view_config: {
  "sections": [
    {
      "step": 1,
      "fields": [
        {
          "label": "Investor Type",
          "options": [],
          "required": true,
          "fieldCode": "INVESTOR_TYPE",
          "fieldType": "text",
          "validation": {},
          "description": "Checking help text",
          "placeholder": "Checking on placeholder",
          "showSettings": true,
          "assignedUsers": [
            "2"
          ]
        },
        {
          "label": "Address Line 1",
          "options": [],
          "required": true,
          "fieldCode": "ADDRESS_LINE_1",
          "fieldType": "text",
          "validation": {},
          "showSettings": true,
          "assignedUsers": [
            "4"
          ]
        }
      ],
      "gridCols": 3,
      "description": "Demo Description",
      "sectionTitle": "Demo title"
    }
  ],
  "tableColumns": [
    {
      "key": "full_name",
      "label": "Full Name",
      "fields": [
        "FIRST_NAME",
        "LAST_NAME"
      ]
    },
    {
      "key": "GENDER",
      "label": "GENDER",
      "fields": [
        "GENDER"
      ]
    },
    {
      "key": "ADDRESS_LINE_1",
      "label": "ADDRESS_LINE_1",
      "fields": [
        "ADDRESS_LINE_1"
      ]
    }
  ]
    },

    version: 1,
    is_current_version: true,
    valid_from: new Date("2025-12-29"),
    valid_to: new Date("2026-12-29"),
    created_at: new Date("2026-01-12T12:21:30.758+05:30"),
  },

  // ------------------------------------------------------------

  {
    policy_id: 2,
    service_id: "960.0",
    scheme_name: "Interest Subsidy",
    scheme_code: "INTEREST_SUBSIDY",

    cascading_config: {
  "groups": [
    {
      "conditions": [
        {
          "value": "Mouli",
          "operator": "equals",
          "policy_id": 2,
          "field_code": "FIRST_NAME",
          "scheme_code": "CAPITAL_SUBSIDY"
        },
        {
          "value": "Demo",
          "operator": "equals",
          "policy_id": 2,
          "field_code": "MIDDLE_NAME",
          "scheme_code": "CAPITAL_SUBSIDY"
        }
      ],
      "joinOperator": null,
      "logicalOperator": "AND"
    },
    {
      "conditions": [
        {
          "value": "Mitra",
          "operator": "equals",
          "policy_id": 2,
          "field_code": "LAST_NAME",
          "scheme_code": "CAPITAL_SUBSIDY"
        }
      ],
      "joinOperator": "OR",
      "logicalOperator": "AND"
    }
  ],
  "trigger": {}
    },
    pop_message_config: {
      title: "Important Information",
      enabled: true,
      sections: [],
      acknowledgement_text:
        "I have read and understood the instructions",
    },

    form_structure_json: {
      sections: [],
      is_multi_step: false,
    },

    required_documents: {
  "document_types": [
    {
      "comment": "",
      "documents": [
        {
          "comment": "",
          "conditions": [],
          "checkpoints": [],
          "document_id": null,
          "is_required": true,
          "max_size_mb": 5,
          "allowed_types": [],
          "document_name": null
        }
      ],
      "conditions": [],
      "is_required": true,
      "document_type_id": 1,
      "document_type_name": "Address Proof"
    }
  ]
    },
    calculation_logic: {},
    workflow_config: {},
    admin_view_config: {},

    version: 1,
    is_current_version: true,
    valid_from: new Date("2025-02-27"),
    valid_to: new Date("2026-12-29"),
    created_at: new Date("2026-01-31T15:21:40.815+05:30"),
  },
];
