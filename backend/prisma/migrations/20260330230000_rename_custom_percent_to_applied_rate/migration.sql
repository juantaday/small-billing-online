ALTER TABLE "product_taxes"
RENAME COLUMN "custom_percent" TO "applied_rate";

ALTER TABLE "product_taxes"
ALTER COLUMN "applied_rate" SET DEFAULT 0;

UPDATE "product_taxes"
SET "applied_rate" = 0
WHERE "applied_rate" IS NULL;

ALTER TABLE "product_taxes"
ALTER COLUMN "applied_rate" SET NOT NULL;
