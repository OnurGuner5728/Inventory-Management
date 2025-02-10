[
  {
    "tablename": "categories",
    "tableowner": "postgres",
    "tablespace": null,
    "hasindexes": true,
    "hasrules": false,
    "hastriggers": true
  },
  {
    "tablename": "products",
    "tableowner": "postgres",
    "tablespace": null,
    "hasindexes": true,
    "hasrules": false,
    "hastriggers": true
  },
  {
    "tablename": "settings",
    "tableowner": "postgres",
    "tablespace": null,
    "hasindexes": true,
    "hasrules": false,
    "hastriggers": true
  },
  {
    "tablename": "stock_movements",
    "tableowner": "postgres",
    "tablespace": null,
    "hasindexes": true,
    "hasrules": false,
    "hastriggers": true
  },
  {
    "tablename": "sub_categories",
    "tableowner": "postgres",
    "tablespace": null,
    "hasindexes": true,
    "hasrules": false,
    "hastriggers": true
  },
  {
    "tablename": "suppliers",
    "tableowner": "postgres",
    "tablespace": null,
    "hasindexes": true,
    "hasrules": false,
    "hastriggers": true
  },
  {
    "tablename": "units",
    "tableowner": "postgres",
    "tablespace": null,
    "hasindexes": true,
    "hasrules": false,
    "hastriggers": true
  }
]





[
  {
    "table_name": "categories",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "categories",
    "column_name": "name",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "categories",
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "categories",
    "column_name": "icon",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "categories",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "categories",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "barcode",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "name",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "category_id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "sub_category_id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "unit_id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "unit_amount",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1",
    "numeric_precision": 10,
    "numeric_scale": 2
  },
  {
    "table_name": "products",
    "column_name": "stock_warehouse",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "0",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "stock_shelf",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "0",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "stock_min_level",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "0",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "stock_max_level",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1000",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "shelf_location",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "price_buying",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "0",
    "numeric_precision": 15,
    "numeric_scale": 2
  },
  {
    "table_name": "products",
    "column_name": "price_selling",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "0",
    "numeric_precision": 15,
    "numeric_scale": 2
  },
  {
    "table_name": "products",
    "column_name": "price_currency",
    "data_type": "character varying",
    "character_maximum_length": 10,
    "is_nullable": "YES",
    "column_default": "'TRY'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "vat_rate",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "18",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "supplier_id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "products",
    "column_name": "expiry_date",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "status",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'active'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "products",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "company_name",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_logo",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_address_street",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_address_district",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_address_city",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_address_country",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_address_postal_code",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_email",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "company_phone",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "inventory_low_stock_warning",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "20",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "inventory_auto_order_threshold",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "10",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "inventory_default_currency",
    "data_type": "character varying",
    "character_maximum_length": 10,
    "is_nullable": "YES",
    "column_default": "'TRY'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "inventory_default_vat_rate",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "18",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "document_prefix_stock_in",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'GIR'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "document_prefix_stock_out",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'CIK'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "document_prefix_return",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'IAD'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "document_prefix_waste",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'FIR'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "document_sequence_stock_in",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "document_sequence_stock_out",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "document_sequence_return",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "document_sequence_waste",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "settings",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "settings",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "stock_movements",
    "column_name": "type",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "product_id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "stock_movements",
    "column_name": "quantity",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 10,
    "numeric_scale": 2
  },
  {
    "table_name": "stock_movements",
    "column_name": "unit_id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "stock_movements",
    "column_name": "unit_amount",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "1",
    "numeric_precision": 10,
    "numeric_scale": 2
  },
  {
    "table_name": "stock_movements",
    "column_name": "price",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 15,
    "numeric_scale": 2
  },
  {
    "table_name": "stock_movements",
    "column_name": "total_price",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 15,
    "numeric_scale": 2
  },
  {
    "table_name": "stock_movements",
    "column_name": "vat_rate",
    "data_type": "integer",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "18",
    "numeric_precision": 32,
    "numeric_scale": 0
  },
  {
    "table_name": "stock_movements",
    "column_name": "vat_amount",
    "data_type": "numeric",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 15,
    "numeric_scale": 2
  },
  {
    "table_name": "stock_movements",
    "column_name": "document_no",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "source_type",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "source_id",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "source_name",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "destination_type",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "destination_location",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "created_by",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "status",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'COMPLETED'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "stock_movements",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "sub_categories",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "sub_categories",
    "column_name": "category_id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "sub_categories",
    "column_name": "name",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "sub_categories",
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "sub_categories",
    "column_name": "icon",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "sub_categories",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "sub_categories",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "suppliers",
    "column_name": "name",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "contact_person",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "email",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "phone",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "address_street",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "address_district",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "address_city",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "address_country",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "address_postal_code",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "tax_office",
    "data_type": "character varying",
    "character_maximum_length": 255,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "tax_number",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "status",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "YES",
    "column_default": "'active'::character varying",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "suppliers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "units",
    "column_name": "id",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": 64,
    "numeric_scale": 0
  },
  {
    "table_name": "units",
    "column_name": "name",
    "data_type": "character varying",
    "character_maximum_length": 100,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "units",
    "column_name": "short_name",
    "data_type": "character varying",
    "character_maximum_length": 20,
    "is_nullable": "NO",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "units",
    "column_name": "type",
    "data_type": "character varying",
    "character_maximum_length": 50,
    "is_nullable": "YES",
    "column_default": null,
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "units",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  },
  {
    "table_name": "units",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())",
    "numeric_precision": null,
    "numeric_scale": null
  }
]






[
  {
    "table_schema": "storage",
    "constraint_name": "objects_bucketId_fkey",
    "table_name": "objects",
    "column_name": "bucket_id",
    "foreign_table_schema": "storage",
    "foreign_table_name": "buckets",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "public",
    "constraint_name": "sub_categories_category_id_fkey",
    "table_name": "sub_categories",
    "column_name": "category_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "categories",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "public",
    "constraint_name": "products_category_id_fkey",
    "table_name": "products",
    "column_name": "category_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "categories",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "public",
    "constraint_name": "products_sub_category_id_fkey",
    "table_name": "products",
    "column_name": "sub_category_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "sub_categories",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "public",
    "constraint_name": "products_supplier_id_fkey",
    "table_name": "products",
    "column_name": "supplier_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "suppliers",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "public",
    "constraint_name": "products_unit_id_fkey",
    "table_name": "products",
    "column_name": "unit_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "units",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "public",
    "constraint_name": "stock_movements_product_id_fkey",
    "table_name": "stock_movements",
    "column_name": "product_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "public",
    "constraint_name": "stock_movements_unit_id_fkey",
    "table_name": "stock_movements",
    "column_name": "unit_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "units",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "refresh_tokens_session_id_fkey",
    "table_name": "refresh_tokens",
    "column_name": "session_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "sessions",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "identities_user_id_fkey",
    "table_name": "identities",
    "column_name": "user_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "users",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "mfa_factors_user_id_fkey",
    "table_name": "mfa_factors",
    "column_name": "user_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "users",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "mfa_challenges_auth_factor_id_fkey",
    "table_name": "mfa_challenges",
    "column_name": "factor_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "mfa_factors",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "sso_domains_sso_provider_id_fkey",
    "table_name": "sso_domains",
    "column_name": "sso_provider_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "sso_providers",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "mfa_amr_claims_session_id_fkey",
    "table_name": "mfa_amr_claims",
    "column_name": "session_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "sessions",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "sessions_user_id_fkey",
    "table_name": "sessions",
    "column_name": "user_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "users",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "saml_relay_states_flow_state_id_fkey",
    "table_name": "saml_relay_states",
    "column_name": "flow_state_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "flow_state",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "saml_relay_states_sso_provider_id_fkey",
    "table_name": "saml_relay_states",
    "column_name": "sso_provider_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "sso_providers",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "saml_providers_sso_provider_id_fkey",
    "table_name": "saml_providers",
    "column_name": "sso_provider_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "sso_providers",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "auth",
    "constraint_name": "one_time_tokens_user_id_fkey",
    "table_name": "one_time_tokens",
    "column_name": "user_id",
    "foreign_table_schema": "auth",
    "foreign_table_name": "users",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "storage",
    "constraint_name": "s3_multipart_uploads_parts_bucket_id_fkey",
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "bucket_id",
    "foreign_table_schema": "storage",
    "foreign_table_name": "buckets",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "storage",
    "constraint_name": "s3_multipart_uploads_parts_upload_id_fkey",
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "upload_id",
    "foreign_table_schema": "storage",
    "foreign_table_name": "s3_multipart_uploads",
    "foreign_column_name": "id"
  },
  {
    "table_schema": "storage",
    "constraint_name": "s3_multipart_uploads_bucket_id_fkey",
    "table_name": "s3_multipart_uploads",
    "column_name": "bucket_id",
    "foreign_table_schema": "storage",
    "foreign_table_name": "buckets",
    "foreign_column_name": "id"
  }
]



[
  {
    "schemaname": "public",
    "table_name": "units",
    "row_count": 6
  },
  {
    "schemaname": "public",
    "table_name": "suppliers",
    "row_count": 2
  },
  {
    "schemaname": "public",
    "table_name": "products",
    "row_count": 1
  },
  {
    "schemaname": "public",
    "table_name": "settings",
    "row_count": 1
  },
  {
    "schemaname": "public",
    "table_name": "sub_categories",
    "row_count": 0
  },
  {
    "schemaname": "public",
    "table_name": "categories",
    "row_count": 0
  },
  {
    "schemaname": "public",
    "table_name": "stock_movements",
    "row_count": 0
  }
]



[
  {
    "schemaname": "public",
    "tablename": "categories",
    "indexname": "categories_pkey",
    "indexdef": "CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "products",
    "indexname": "products_barcode_key",
    "indexdef": "CREATE UNIQUE INDEX products_barcode_key ON public.products USING btree (barcode)"
  },
  {
    "schemaname": "public",
    "tablename": "products",
    "indexname": "products_pkey",
    "indexdef": "CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "settings",
    "indexname": "settings_pkey",
    "indexdef": "CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "stock_movements",
    "indexname": "stock_movements_pkey",
    "indexdef": "CREATE UNIQUE INDEX stock_movements_pkey ON public.stock_movements USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "sub_categories",
    "indexname": "sub_categories_pkey",
    "indexdef": "CREATE UNIQUE INDEX sub_categories_pkey ON public.sub_categories USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "suppliers",
    "indexname": "suppliers_pkey",
    "indexdef": "CREATE UNIQUE INDEX suppliers_pkey ON public.suppliers USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "units",
    "indexname": "units_pkey",
    "indexdef": "CREATE UNIQUE INDEX units_pkey ON public.units USING btree (id)"
  }
]




[
  {
    "table_name": "products",
    "total_size": "48 kB",
    "data_size": "8192 bytes",
    "external_size": "40 kB"
  },
  {
    "table_name": "settings",
    "total_size": "32 kB",
    "data_size": "8192 bytes",
    "external_size": "24 kB"
  },
  {
    "table_name": "sub_categories",
    "total_size": "32 kB",
    "data_size": "8192 bytes",
    "external_size": "24 kB"
  },
  {
    "table_name": "categories",
    "total_size": "32 kB",
    "data_size": "8192 bytes",
    "external_size": "24 kB"
  },
  {
    "table_name": "suppliers",
    "total_size": "32 kB",
    "data_size": "8192 bytes",
    "external_size": "24 kB"
  },
  {
    "table_name": "stock_movements",
    "total_size": "32 kB",
    "data_size": "8192 bytes",
    "external_size": "24 kB"
  },
  {
    "table_name": "units",
    "total_size": "24 kB",
    "data_size": "8192 bytes",
    "external_size": "16 kB"
  }
]



[
  {
    "schemaname": "public",
    "table_name": "categories",
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "schemaname": "public",
    "table_name": "products",
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "schemaname": "public",
    "table_name": "settings",
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "schemaname": "public",
    "table_name": "stock_movements",
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "schemaname": "public",
    "table_name": "sub_categories",
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "schemaname": "public",
    "table_name": "suppliers",
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  },
  {
    "schemaname": "public",
    "table_name": "units",
    "last_vacuum": null,
    "last_autovacuum": null,
    "last_analyze": null,
    "last_autoanalyze": null
  }
]




[
  {
    "schemaname": "public",
    "table_name": "categories",
    "seq_scan": 366,
    "seq_tup_read": 765,
    "idx_scan": 1064,
    "idx_tup_fetch": 912,
    "n_tup_ins": 17,
    "n_tup_upd": 3,
    "n_tup_del": 17
  },
  {
    "schemaname": "public",
    "table_name": "products",
    "seq_scan": 430,
    "seq_tup_read": 1507,
    "idx_scan": 1215,
    "idx_tup_fetch": 1214,
    "n_tup_ins": 23,
    "n_tup_upd": 25,
    "n_tup_del": 10
  },
  {
    "schemaname": "public",
    "table_name": "settings",
    "seq_scan": 296,
    "seq_tup_read": 295,
    "idx_scan": 0,
    "idx_tup_fetch": 0,
    "n_tup_ins": 1,
    "n_tup_upd": 0,
    "n_tup_del": 0
  },
  {
    "schemaname": "public",
    "table_name": "stock_movements",
    "seq_scan": 379,
    "seq_tup_read": 1430,
    "idx_scan": 0,
    "idx_tup_fetch": 0,
    "n_tup_ins": 18,
    "n_tup_upd": 0,
    "n_tup_del": 14
  },
  {
    "schemaname": "public",
    "table_name": "sub_categories",
    "seq_scan": 697,
    "seq_tup_read": 6989,
    "idx_scan": 1031,
    "idx_tup_fetch": 879,
    "n_tup_ins": 12,
    "n_tup_upd": 0,
    "n_tup_del": 12
  },
  {
    "schemaname": "public",
    "table_name": "suppliers",
    "seq_scan": 352,
    "seq_tup_read": 872,
    "idx_scan": 1039,
    "idx_tup_fetch": 907,
    "n_tup_ins": 4,
    "n_tup_upd": 1,
    "n_tup_del": 2
  },
  {
    "schemaname": "public",
    "table_name": "units",
    "seq_scan": 393,
    "seq_tup_read": 2303,
    "idx_scan": 2247,
    "idx_tup_fetch": 2093,
    "n_tup_ins": 15,
    "n_tup_upd": 8,
    "n_tup_del": 9
  }
]