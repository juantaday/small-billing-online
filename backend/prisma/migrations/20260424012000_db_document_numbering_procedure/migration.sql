-- Move document numbering responsibility to DB and allow numbering per document type.

-- 1) invoice_number uniqueness must be per document type (not globally).
DROP INDEX IF EXISTS "sales_invoice_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "sales_invoice_number_document_type_id_key"
  ON "sales" ("invoice_number", "document_type_id");

-- 2) Centralized DB-side document number generator.
-- It increments terminal_settings.last_sequential atomically and returns
-- the next formatted number: EST-PEM-000000001.
CREATE OR REPLACE FUNCTION public.generate_sale_invoice_number(
  p_terminal_id INTEGER,
  p_document_type_id INTEGER
)
RETURNS VARCHAR(17)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_establishment VARCHAR(3);
  v_point_of_sale VARCHAR(3);
  v_next_sequential INTEGER;
  v_invoice_number VARCHAR(17);
  v_attempts INTEGER := 0;
BEGIN
  SELECT w."establishment_code", t."emission_point"
    INTO v_establishment, v_point_of_sale
  FROM "terminals" t
  JOIN "warehouses" w ON w."id" = t."warehouse_id"
  WHERE t."id" = p_terminal_id;

  IF v_establishment IS NULL OR v_point_of_sale IS NULL THEN
    RAISE EXCEPTION 'No existe terminal % o no tiene establecimiento/punto de emisión válido', p_terminal_id;
  END IF;

  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 1000 THEN
      RAISE EXCEPTION 'No se pudo generar número de documento único para terminal %, tipo %', p_terminal_id, p_document_type_id;
    END IF;

    INSERT INTO "terminal_settings" (
      "id",
      "terminal_id",
      "document_type_id",
      "max_items",
      "enabled",
      "last_sequential",
      "created_at",
      "updated_at"
    )
    VALUES (
      gen_random_uuid()::text,
      p_terminal_id,
      p_document_type_id,
      100,
      TRUE,
      1,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("terminal_id", "document_type_id")
    DO UPDATE
      SET "last_sequential" = "terminal_settings"."last_sequential" + 1,
          "updated_at" = CURRENT_TIMESTAMP
    RETURNING "last_sequential" INTO v_next_sequential;

    v_invoice_number :=
      v_establishment || '-' || v_point_of_sale || '-' || LPAD(v_next_sequential::text, 9, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM "sales" s
      WHERE s."invoice_number" = v_invoice_number
        AND s."document_type_id" = p_document_type_id
    );
  END LOOP;

  RETURN v_invoice_number;
END;
$function$;
