-- Add unique constraints requested for products and presentations
ALTER TABLE "products"
ADD CONSTRAINT "products_name_key" UNIQUE ("name");

ALTER TABLE "presentations"
ADD CONSTRAINT "presentations_product_id_presentation_type_id_key" UNIQUE ("product_id", "presentation_type_id");

-- Add indexes for foreign keys if they do not exist
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "products_default_purchase_presentation_id_idx" ON "products"("default_purchase_presentation_id");
CREATE INDEX IF NOT EXISTS "products_default_sale_presentation_id_idx" ON "products"("default_sale_presentation_id");
CREATE INDEX IF NOT EXISTS "presentations_product_id_idx" ON "presentations"("product_id");
CREATE INDEX IF NOT EXISTS "presentations_presentation_type_id_idx" ON "presentations"("presentation_type_id");
CREATE INDEX IF NOT EXISTS "presentations_presentation_inference_idx" ON "presentations"("presentation_inference");

-- Ensure foreign keys exist (idempotent checks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE "products"
    ADD CONSTRAINT "products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_default_purchase_presentation_id_fkey'
  ) THEN
    ALTER TABLE "products"
    ADD CONSTRAINT "products_default_purchase_presentation_id_fkey"
    FOREIGN KEY ("default_purchase_presentation_id") REFERENCES "presentations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_default_sale_presentation_id_fkey'
  ) THEN
    ALTER TABLE "products"
    ADD CONSTRAINT "products_default_sale_presentation_id_fkey"
    FOREIGN KEY ("default_sale_presentation_id") REFERENCES "presentations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'presentations_product_id_fkey'
  ) THEN
    ALTER TABLE "presentations"
    ADD CONSTRAINT "presentations_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'presentations_presentation_type_id_fkey'
  ) THEN
    ALTER TABLE "presentations"
    ADD CONSTRAINT "presentations_presentation_type_id_fkey"
    FOREIGN KEY ("presentation_type_id") REFERENCES "presentation_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'presentations_presentation_inference_fkey'
  ) THEN
    ALTER TABLE "presentations"
    ADD CONSTRAINT "presentations_presentation_inference_fkey"
    FOREIGN KEY ("presentation_inference") REFERENCES "presentations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
