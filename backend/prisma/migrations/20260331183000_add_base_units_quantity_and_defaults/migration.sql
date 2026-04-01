-- Add internal base units quantity for presentations
ALTER TABLE "presentations"
ADD COLUMN "base_units_quantity" INTEGER NOT NULL DEFAULT 1;

-- Utility function: calculate real base units quantity for a presentation
CREATE OR REPLACE FUNCTION "fn_compute_base_units_quantity"(p_presentation_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_result BIGINT;
BEGIN
  WITH RECURSIVE chain AS (
    SELECT
      p."id",
      GREATEST(p."quantity", 1)::BIGINT AS accumulated,
      p."presentation_inference",
      ARRAY[p."id"]::TEXT[] AS visited
    FROM "presentations" p
    WHERE p."id" = p_presentation_id

    UNION ALL

    SELECT
      parent."id",
      chain.accumulated * GREATEST(parent."quantity", 1)::BIGINT AS accumulated,
      parent."presentation_inference",
      chain.visited || parent."id"
    FROM chain
    JOIN "presentations" parent
      ON parent."id" = chain."presentation_inference"
    WHERE chain."presentation_inference" IS NOT NULL
      AND chain."presentation_inference" <> chain."id"
      AND NOT (parent."id" = ANY(chain.visited))
  )
  SELECT c.accumulated
  INTO v_result
  FROM chain c
  ORDER BY array_length(c.visited, 1) DESC
  LIMIT 1;

  IF v_result IS NULL OR v_result < 1 THEN
    RETURN 1;
  END IF;

  IF v_result > 2147483647 THEN
    RETURN 2147483647;
  END IF;

  RETURN v_result::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Recompute base units quantity for all presentations of a product
CREATE OR REPLACE FUNCTION "fn_refresh_base_units_quantity_by_product"(p_product_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE "presentations" p
  SET "base_units_quantity" = "fn_compute_base_units_quantity"(p."id")
  WHERE p."product_id" = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: refresh computed value after insert/update
CREATE OR REPLACE FUNCTION "fn_on_presentation_base_units_change"()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM "fn_refresh_base_units_quantity_by_product"(NEW."product_id");

  IF TG_OP = 'UPDATE' AND OLD."product_id" <> NEW."product_id" THEN
    PERFORM "fn_refresh_base_units_quantity_by_product"(OLD."product_id");
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_refresh_base_units_quantity" ON "presentations";

CREATE TRIGGER "trg_refresh_base_units_quantity"
AFTER INSERT OR UPDATE OF "quantity", "presentation_inference", "product_id"
ON "presentations"
FOR EACH ROW
EXECUTE FUNCTION "fn_on_presentation_base_units_change"();

-- Backfill values for existing data
UPDATE "presentations" p
SET "base_units_quantity" = "fn_compute_base_units_quantity"(p."id");
