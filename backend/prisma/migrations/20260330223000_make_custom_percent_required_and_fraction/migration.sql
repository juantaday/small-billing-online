-- Set default first
ALTER TABLE "product_taxes"
ALTER COLUMN "custom_percent" SET DEFAULT 0;

-- Normalize existing values to decimal fraction format (15 => 0.15)
UPDATE "product_taxes" pt
SET "custom_percent" = CASE
  WHEN tv."percentage" > 1 THEN ROUND((tv."percentage" / 100)::numeric, 4)
  ELSE tv."percentage"
END
FROM "tax_values" tv
WHERE pt."tax_value_code" = tv."code";

-- Safety for remaining nulls
UPDATE "product_taxes"
SET "custom_percent" = 0
WHERE "custom_percent" IS NULL;

-- Enforce not null
ALTER TABLE "product_taxes"
ALTER COLUMN "custom_percent" SET NOT NULL;
