-- 1) Add presentation inference relation
ALTER TABLE "presentations"
ADD COLUMN "presentation_inference" TEXT;

ALTER TABLE "presentations"
ADD CONSTRAINT "presentations_presentation_inference_fkey"
FOREIGN KEY ("presentation_inference") REFERENCES "presentations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2) Create centralized product stocks table
CREATE TABLE "product_stocks" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "stock_presentation_type_id" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "max_stock" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_stocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_stocks_product_id_key" ON "product_stocks"("product_id");

ALTER TABLE "product_stocks"
ADD CONSTRAINT "product_stocks_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_stocks"
ADD CONSTRAINT "product_stocks_stock_presentation_type_id_fkey"
FOREIGN KEY ("stock_presentation_type_id") REFERENCES "presentation_types"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3) Initialize presentation_inference in existing records
UPDATE "presentations"
SET "presentation_inference" = "id"
WHERE "presentation_inference" IS NULL;

-- 4) Migrate current stock data (take base from "Unidad" presentation when available)
INSERT INTO "product_stocks" (
  "id",
  "product_id",
  "stock_presentation_type_id",
  "stock",
  "min_stock",
  "max_stock",
  "created_at",
  "updated_at"
)
SELECT
  'migr_' || md5(random()::text || clock_timestamp()::text || p."id") as "id",
  p."id" as "product_id",
  COALESCE(unit_pt."id", base_pres."presentation_type_id") as "stock_presentation_type_id",
  COALESCE(base_pres."stock", 0) as "stock",
  COALESCE(base_pres."min_stock", 0) as "min_stock",
  base_pres."max_stock" as "max_stock",
  CURRENT_TIMESTAMP as "created_at",
  CURRENT_TIMESTAMP as "updated_at"
FROM "products" p
LEFT JOIN LATERAL (
  SELECT pt."id"
  FROM "presentation_types" pt
  WHERE lower(pt."name") = 'unidad' AND pt."active" = true
  ORDER BY pt."created_at" ASC
  LIMIT 1
) unit_pt ON true
LEFT JOIN LATERAL (
  SELECT pr.*
  FROM "presentations" pr
  WHERE pr."product_id" = p."id"
  ORDER BY CASE WHEN unit_pt."id" IS NOT NULL AND pr."presentation_type_id" = unit_pt."id" THEN 0 ELSE 1 END,
           pr."created_at" ASC
  LIMIT 1
) base_pres ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "product_stocks" ps
  WHERE ps."product_id" = p."id"
);

-- 5) Drop deprecated stock columns from presentations
ALTER TABLE "presentations"
DROP COLUMN "stock",
DROP COLUMN "min_stock",
DROP COLUMN "max_stock";

-- 6) Trigger: auto-create base presentation + product stock on product insert
CREATE OR REPLACE FUNCTION "fn_create_base_presentation_and_stock"()
RETURNS TRIGGER AS $$
DECLARE
  v_unit_type_id TEXT;
  v_presentation_id TEXT;
  v_stock_id TEXT;
BEGIN
  SELECT pt."id"
  INTO v_unit_type_id
  FROM "presentation_types" pt
  WHERE lower(pt."name") = 'unidad' AND pt."active" = true
  ORDER BY pt."created_at" ASC
  LIMIT 1;

  IF v_unit_type_id IS NULL THEN
    RAISE EXCEPTION 'No existe un presentation_type activo llamado Unidad';
  END IF;

  v_presentation_id := 'trgpr_' || md5(random()::text || clock_timestamp()::text || NEW."id");
  v_stock_id := 'trgps_' || md5(clock_timestamp()::text || random()::text || NEW."id");

  INSERT INTO "presentations" (
    "id",
    "product_id",
    "presentation_type_id",
    "presentation_inference",
    "quantity",
    "barcode",
    "cost_price",
    "last_cost_price",
    "average_cost_price",
    "sale_price",
    "active",
    "created_at",
    "updated_at"
  ) VALUES (
    v_presentation_id,
    NEW."id",
    v_unit_type_id,
    v_presentation_id,
    1,
    NULL,
    0,
    0,
    0,
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  INSERT INTO "product_stocks" (
    "id",
    "product_id",
    "stock_presentation_type_id",
    "stock",
    "min_stock",
    "max_stock",
    "created_at",
    "updated_at"
  ) VALUES (
    v_stock_id,
    NEW."id",
    v_unit_type_id,
    0,
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_create_base_presentation_and_stock" ON "products";

CREATE TRIGGER "trg_create_base_presentation_and_stock"
AFTER INSERT ON "products"
FOR EACH ROW
EXECUTE FUNCTION "fn_create_base_presentation_and_stock"();
