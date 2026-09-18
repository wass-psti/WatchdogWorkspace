export const M46_BOARD_CONTRACT_VERSION = "1.43.2-m46-v1" as const;
export const M46_BOARD_CONTRACT_DIGEST = "2e5db3073f702cad96be3eb1d4a18b33ea039252ad4d0532dc9b6e1b3ca0da1c" as const;

export const M46_BOARD_BACKEND_CONTRACT = Object.freeze({
  "version": "1.43.2-m46-v1",
  "rpcs": [
    {
      "name": "wm_board_backend_capabilities",
      "argNames": [],
      "argTypes": [],
      "defaultCount": 0,
      "returnType": "jsonb",
      "outputFields": []
    },
    {
      "name": "wm_list_boards",
      "argNames": [
        "p_status"
      ],
      "argTypes": [
        "text"
      ],
      "defaultCount": 1,
      "returnType": "record",
      "outputFields": [
        "id:uuid",
        "name:text",
        "description:text",
        "status:text",
        "member_role:text",
        "item_count:bigint",
        "updated_at:timestamp with time zone",
        "created_at:timestamp with time zone"
      ]
    },
    {
      "name": "wm_get_board",
      "argNames": [
        "p_board_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "jsonb",
      "outputFields": []
    },
    {
      "name": "wm_create_board",
      "argNames": [
        "p_name",
        "p_description"
      ],
      "argTypes": [
        "text",
        "text"
      ],
      "defaultCount": 1,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_create_board_configured",
      "argNames": [
        "p_name",
        "p_description",
        "p_columns"
      ],
      "argTypes": [
        "text",
        "text",
        "jsonb"
      ],
      "defaultCount": 2,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_add_board_column",
      "argNames": [
        "p_board_id",
        "p_name",
        "p_data_type",
        "p_config"
      ],
      "argTypes": [
        "uuid",
        "text",
        "text",
        "jsonb"
      ],
      "defaultCount": 1,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_add_board_column_at",
      "argNames": [
        "p_board_id",
        "p_name",
        "p_data_type",
        "p_config",
        "p_position"
      ],
      "argTypes": [
        "uuid",
        "text",
        "text",
        "jsonb",
        "integer"
      ],
      "defaultCount": 2,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_duplicate_board",
      "argNames": [
        "p_board_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_update_board",
      "argNames": [
        "p_board_id",
        "p_name",
        "p_description"
      ],
      "argTypes": [
        "uuid",
        "text",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_delete_board_permanently",
      "argNames": [
        "p_board_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_get_board_preferences",
      "argNames": [
        "p_board_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "jsonb",
      "outputFields": []
    },
    {
      "name": "wm_set_board_preferences",
      "argNames": [
        "p_board_id",
        "p_preferences"
      ],
      "argTypes": [
        "uuid",
        "jsonb"
      ],
      "defaultCount": 0,
      "returnType": "jsonb",
      "outputFields": []
    },
    {
      "name": "wm_add_board_group",
      "argNames": [
        "p_board_id",
        "p_title"
      ],
      "argTypes": [
        "uuid",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_update_board_group",
      "argNames": [
        "p_group_id",
        "p_title"
      ],
      "argTypes": [
        "uuid",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_move_board_group",
      "argNames": [
        "p_group_id",
        "p_position"
      ],
      "argTypes": [
        "uuid",
        "integer"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_delete_board_group",
      "argNames": [
        "p_group_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_set_board_group_accent",
      "argNames": [
        "p_group_id",
        "p_accent_color"
      ],
      "argTypes": [
        "uuid",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_update_board_column",
      "argNames": [
        "p_column_id",
        "p_name",
        "p_config",
        "p_visible"
      ],
      "argTypes": [
        "uuid",
        "text",
        "jsonb",
        "boolean"
      ],
      "defaultCount": 1,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_change_board_column_type",
      "argNames": [
        "p_column_id",
        "p_data_type",
        "p_config",
        "p_clear_values"
      ],
      "argTypes": [
        "uuid",
        "text",
        "jsonb",
        "boolean"
      ],
      "defaultCount": 2,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_move_board_column",
      "argNames": [
        "p_column_id",
        "p_position"
      ],
      "argTypes": [
        "uuid",
        "integer"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_duplicate_board_column",
      "argNames": [
        "p_column_id",
        "p_with_values"
      ],
      "argTypes": [
        "uuid",
        "boolean"
      ],
      "defaultCount": 1,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_delete_board_column",
      "argNames": [
        "p_column_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_add_board_item",
      "argNames": [
        "p_board_id",
        "p_group_id",
        "p_title"
      ],
      "argTypes": [
        "uuid",
        "uuid",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_update_board_item",
      "argNames": [
        "p_item_id",
        "p_title",
        "p_status",
        "p_assignee_id",
        "p_due_date",
        "p_notes"
      ],
      "argTypes": [
        "uuid",
        "text",
        "text",
        "uuid",
        "date",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_move_board_item",
      "argNames": [
        "p_item_id",
        "p_group_id",
        "p_position",
        "p_status"
      ],
      "argTypes": [
        "uuid",
        "uuid",
        "integer",
        "text"
      ],
      "defaultCount": 1,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_duplicate_board_item",
      "argNames": [
        "p_item_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_delete_board_item",
      "argNames": [
        "p_item_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_set_board_item_archived",
      "argNames": [
        "p_item_id",
        "p_archived"
      ],
      "argTypes": [
        "uuid",
        "boolean"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_set_board_cell",
      "argNames": [
        "p_item_id",
        "p_column_id",
        "p_value"
      ],
      "argTypes": [
        "uuid",
        "uuid",
        "jsonb"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_set_board_status",
      "argNames": [
        "p_board_id",
        "p_status"
      ],
      "argTypes": [
        "uuid",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_set_board_status_labels",
      "argNames": [
        "p_column_id",
        "p_labels",
        "p_default_label_id"
      ],
      "argTypes": [
        "uuid",
        "jsonb",
        "text"
      ],
      "defaultCount": 1,
      "returnType": "jsonb",
      "outputFields": []
    },
    {
      "name": "wm_set_board_view",
      "argNames": [
        "p_board_id",
        "p_view"
      ],
      "argTypes": [
        "uuid",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_add_board_member",
      "argNames": [
        "p_board_id",
        "p_email",
        "p_role"
      ],
      "argTypes": [
        "uuid",
        "text",
        "text"
      ],
      "defaultCount": 1,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_remove_board_member",
      "argNames": [
        "p_board_id",
        "p_user_id"
      ],
      "argTypes": [
        "uuid",
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_get_board_item_workspace",
      "argNames": [
        "p_item_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "jsonb",
      "outputFields": []
    },
    {
      "name": "wm_add_board_item_update",
      "argNames": [
        "p_item_id",
        "p_body"
      ],
      "argTypes": [
        "uuid",
        "text"
      ],
      "defaultCount": 0,
      "returnType": "bigint",
      "outputFields": []
    },
    {
      "name": "wm_delete_board_item_update",
      "argNames": [
        "p_update_id"
      ],
      "argTypes": [
        "bigint"
      ],
      "defaultCount": 0,
      "returnType": "void",
      "outputFields": []
    },
    {
      "name": "wm_register_board_item_file",
      "argNames": [
        "p_item_id",
        "p_storage_path",
        "p_file_name",
        "p_mime_type",
        "p_size_bytes"
      ],
      "argTypes": [
        "uuid",
        "text",
        "text",
        "text",
        "bigint"
      ],
      "defaultCount": 0,
      "returnType": "uuid",
      "outputFields": []
    },
    {
      "name": "wm_delete_board_item_file",
      "argNames": [
        "p_file_id"
      ],
      "argTypes": [
        "uuid"
      ],
      "defaultCount": 0,
      "returnType": "text",
      "outputFields": []
    },
    {
      "name": "wm_list_board_events",
      "argNames": [
        "p_board_id",
        "p_limit"
      ],
      "argTypes": [
        "uuid",
        "integer"
      ],
      "defaultCount": 1,
      "returnType": "record",
      "outputFields": [
        "id:bigint",
        "event_type:text",
        "message:text",
        "entity_type:text",
        "entity_id:text",
        "payload:jsonb",
        "created_at:timestamp with time zone",
        "actor_id:uuid",
        "actor_name:text",
        "actor_email:text"
      ]
    }
  ],
  "tables": [
    {
      "name": "work_boards",
      "columns": [
        {
          "name": "id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "workspace_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "name",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "description",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "status",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "created_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "updated_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "updated_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "archived_at",
          "udt": "timestamptz",
          "nullable": "YES"
        },
        {
          "name": "trashed_at",
          "udt": "timestamptz",
          "nullable": "YES"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_members",
      "columns": [
        {
          "name": "board_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "user_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "role",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "view_mode",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "added_by",
          "udt": "uuid",
          "nullable": "YES"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "updated_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "preferences",
          "udt": "jsonb",
          "nullable": "NO"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_groups",
      "columns": [
        {
          "name": "id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "board_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "title",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "accent_color",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "position",
          "udt": "int4",
          "nullable": "NO"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "updated_at",
          "udt": "timestamptz",
          "nullable": "NO"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_columns",
      "columns": [
        {
          "name": "id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "board_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "column_key",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "name",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "data_type",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "system_key",
          "udt": "text",
          "nullable": "YES"
        },
        {
          "name": "position",
          "udt": "int4",
          "nullable": "NO"
        },
        {
          "name": "visible",
          "udt": "bool",
          "nullable": "NO"
        },
        {
          "name": "required",
          "udt": "bool",
          "nullable": "NO"
        },
        {
          "name": "config",
          "udt": "jsonb",
          "nullable": "NO"
        },
        {
          "name": "created_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "updated_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "updated_at",
          "udt": "timestamptz",
          "nullable": "NO"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_items",
      "columns": [
        {
          "name": "id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "board_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "group_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "title",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "status",
          "udt": "text",
          "nullable": "YES"
        },
        {
          "name": "assignee_id",
          "udt": "uuid",
          "nullable": "YES"
        },
        {
          "name": "due_date",
          "udt": "date",
          "nullable": "YES"
        },
        {
          "name": "notes",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "position",
          "udt": "int4",
          "nullable": "NO"
        },
        {
          "name": "archived_at",
          "udt": "timestamptz",
          "nullable": "YES"
        },
        {
          "name": "created_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "updated_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "updated_at",
          "udt": "timestamptz",
          "nullable": "NO"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_item_values",
      "columns": [
        {
          "name": "item_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "column_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "value",
          "udt": "jsonb",
          "nullable": "YES"
        },
        {
          "name": "updated_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "updated_at",
          "udt": "timestamptz",
          "nullable": "NO"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_item_updates",
      "columns": [
        {
          "name": "id",
          "udt": "int8",
          "nullable": "NO"
        },
        {
          "name": "board_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "item_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "body",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "created_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        },
        {
          "name": "updated_at",
          "udt": "timestamptz",
          "nullable": "NO"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_item_files",
      "columns": [
        {
          "name": "id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "board_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "item_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "storage_path",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "file_name",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "mime_type",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "size_bytes",
          "udt": "int8",
          "nullable": "NO"
        },
        {
          "name": "created_by",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        }
      ],
      "policies": []
    },
    {
      "name": "work_board_events",
      "columns": [
        {
          "name": "id",
          "udt": "int8",
          "nullable": "NO"
        },
        {
          "name": "board_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "actor_id",
          "udt": "uuid",
          "nullable": "NO"
        },
        {
          "name": "event_type",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "message",
          "udt": "text",
          "nullable": "NO"
        },
        {
          "name": "entity_type",
          "udt": "text",
          "nullable": "YES"
        },
        {
          "name": "entity_id",
          "udt": "text",
          "nullable": "YES"
        },
        {
          "name": "payload",
          "udt": "jsonb",
          "nullable": "NO"
        },
        {
          "name": "created_at",
          "udt": "timestamptz",
          "nullable": "NO"
        }
      ],
      "policies": []
    }
  ],
  "storage": {
    "bucket": "work-board-files",
    "public": false,
    "fileSizeLimit": 20971520,
    "policies": [
      {
        "name": "wm board files read",
        "command": "SELECT",
        "roles": [
          "authenticated"
        ],
        "expression": "USING",
        "requiredFragments": [
          "work-board-files",
          "work_board_access",
          "view"
        ],
        "forbiddenFragments": [
          "owner_id"
        ]
      },
      {
        "name": "wm board files insert",
        "command": "INSERT",
        "roles": [
          "authenticated"
        ],
        "expression": "WITH CHECK",
        "requiredFragments": [
          "work-board-files",
          "owner_id",
          "auth.uid",
          "work_board_access",
          "view"
        ],
        "forbiddenFragments": []
      },
      {
        "name": "wm board files delete",
        "command": "DELETE",
        "roles": [
          "authenticated"
        ],
        "expression": "USING",
        "requiredFragments": [
          "work-board-files",
          "owner_id",
          "auth.uid",
          "work_board_access",
          "manage"
        ],
        "forbiddenFragments": []
      }
    ],
    "allowedMimeTypes": null
  },
  "realtime": {
    "functions": [
      {
        "name": "work_board_realtime_topic_access",
        "argTypes": [
          "text"
        ],
        "returnType": "boolean",
        "securityDefiner": true,
        "searchPath": "",
        "authenticatedExecute": true,
        "anonExecute": false
      },
      {
        "name": "work_board_realtime_broadcast_change",
        "argTypes": [],
        "returnType": "trigger",
        "securityDefiner": true,
        "searchPath": "",
        "authenticatedExecute": false,
        "anonExecute": false
      }
    ],
    "policies": [
      {
        "name": "wm_board_realtime_receive",
        "command": "SELECT",
        "roles": [
          "authenticated"
        ],
        "expression": "USING",
        "requiredFragments": [
          "broadcast",
          "presence",
          "work_board_realtime_topic_access",
          "realtime.topic"
        ],
        "forbiddenFragments": []
      },
      {
        "name": "wm_board_realtime_presence_track",
        "command": "INSERT",
        "roles": [
          "authenticated"
        ],
        "expression": "WITH CHECK",
        "requiredFragments": [
          "presence",
          "work_board_realtime_topic_access",
          "realtime.topic"
        ],
        "forbiddenFragments": [
          "broadcast"
        ]
      }
    ],
    "triggers": [
      {
        "name": "work_boards_realtime_change",
        "table": "work_boards",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      },
      {
        "name": "work_board_members_realtime_change",
        "table": "work_board_members",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      },
      {
        "name": "work_board_groups_realtime_change",
        "table": "work_board_groups",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      },
      {
        "name": "work_board_items_realtime_change",
        "table": "work_board_items",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      },
      {
        "name": "work_board_columns_realtime_change",
        "table": "work_board_columns",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      },
      {
        "name": "work_board_item_values_realtime_change",
        "table": "work_board_item_values",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      },
      {
        "name": "work_board_item_updates_realtime_change",
        "table": "work_board_item_updates",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      },
      {
        "name": "work_board_item_files_realtime_change",
        "table": "work_board_item_files",
        "function": "work_board_realtime_broadcast_change",
        "events": [
          "INSERT",
          "UPDATE",
          "DELETE"
        ]
      }
    ]
  },
  "dto": {
    "workspaceIdentityKeys": [
      "author_id",
      "actor_id"
    ],
    "compatibilityAliases": [
      "created_by"
    ]
  },
  "capabilities": {
    "canonical_workspace_identity": true,
    "scoped_query_cache": true,
    "authoritative_file_delete": true,
    "live_contract_attestation": true,
    "private_board_realtime": true
  }
});
