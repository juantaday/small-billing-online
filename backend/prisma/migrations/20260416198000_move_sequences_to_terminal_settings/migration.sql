-- Move invoice sequence control into terminal_settings (terminal + documentType)

ALTER TABLE "terminal_settings"
  ADD COLUMN "last_sequential" INTEGER NOT NULL DEFAULT 0;

-- Backfill counters from legacy invoice_sequences when terminal_settings row exists
UPDATE "terminal_settings" ts
SET "last_sequential" = GREATEST(ts."last_sequential", seq."last_sequential")
FROM "invoice_sequences" seq
JOIN "terminals" t
  ON t."emission_point" = seq."point_of_sale"
JOIN "warehouses" w
  ON w."id" = t."warehouse_id"
WHERE w."establishment_code" = seq."establishment"
  AND ts."terminal_id" = t."id"
  AND ts."document_type_id" = seq."document_type_id";

-- Create missing terminal_settings rows from invoice_sequences to preserve counters
INSERT INTO "terminal_settings" (
  "id",
  "terminal_id",
  "document_type_id",
  "name_printer",
  "character_line",
  "with_logo",
  "max_items",
  "lines_per_transaction",
  "last_sequential",
  "enabled",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  t."id",
  seq."document_type_id",
  NULL,
  40,
  'SMALL'::"LogoSize",
  100,
  NULL,
  seq."last_sequential",
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "invoice_sequences" seq
JOIN "terminals" t
  ON t."emission_point" = seq."point_of_sale"
JOIN "warehouses" w
  ON w."id" = t."warehouse_id"
LEFT JOIN "terminal_settings" ts
  ON ts."terminal_id" = t."id"
  AND ts."document_type_id" = seq."document_type_id"
WHERE w."establishment_code" = seq."establishment"
  AND ts."id" IS NULL;

DROP TABLE IF EXISTS "invoice_sequences";
