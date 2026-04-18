-- CreateTable
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "document_name" VARCHAR(120) NOT NULL,
    "items_auto_generate" INTEGER NOT NULL DEFAULT 0,
    "indefinite" BOOLEAN NOT NULL DEFAULT false,
    "document_category_id" INTEGER NOT NULL,
    "id_group_numeration" INTEGER NOT NULL,
    "cod_sri" VARCHAR(2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- Seed default document types (SRI + internos)
INSERT INTO "document_types" (
    "id",
    "document_name",
    "items_auto_generate",
    "indefinite",
    "document_category_id",
    "id_group_numeration",
    "cod_sri",
    "active",
    "updated_at"
)
VALUES
    (1, 'Factura', 37, false, 1, 1, '01', true, CURRENT_TIMESTAMP),
    (2, 'Nota de venta', 37, false, 1, 2, NULL, true, CURRENT_TIMESTAMP),
    (3, 'Proforma', 0, true, 1, 2, NULL, true, CURRENT_TIMESTAMP),
    (4, 'Guia de remision', 10, true, 1, 1, '06', true, CURRENT_TIMESTAMP),
    (5, 'Nota de credito', 37, false, 1, 1, '04', true, CURRENT_TIMESTAMP),
    (6, 'Nota de debito', 37, false, 1, 1, '05', true, CURRENT_TIMESTAMP),
    (7, 'Comprobante de retencion', 37, false, 1, 1, '07', true, CURRENT_TIMESTAMP);

SELECT setval(
    pg_get_serial_sequence('"document_types"', 'id'),
    (SELECT MAX("id") FROM "document_types")
);

-- AlterTable terminal_settings: enum -> FK
ALTER TABLE "terminal_settings"
    ADD COLUMN "document_type_id" INTEGER;

UPDATE "terminal_settings"
SET "document_type_id" = CASE "document_type"
    WHEN 'FACTURA' THEN 1
    WHEN 'GUIA_REMISION' THEN 4
    WHEN 'NOTA_CREDITO' THEN 5
    WHEN 'NOTA_DEBITO' THEN 6
    WHEN 'RETENCION' THEN 7
    ELSE 1
END;

ALTER TABLE "terminal_settings"
    ALTER COLUMN "document_type_id" SET NOT NULL,
    DROP COLUMN "document_type";

-- AlterTable invoice_sequences: enum -> FK
ALTER TABLE "invoice_sequences"
    ADD COLUMN "document_type_id" INTEGER;

UPDATE "invoice_sequences"
SET "document_type_id" = CASE "document_type"
    WHEN 'FACTURA' THEN 1
    WHEN 'GUIA_REMISION' THEN 4
    WHEN 'NOTA_CREDITO' THEN 5
    WHEN 'NOTA_DEBITO' THEN 6
    WHEN 'RETENCION' THEN 7
    ELSE 1
END;

ALTER TABLE "invoice_sequences"
    ALTER COLUMN "document_type_id" SET NOT NULL,
    DROP COLUMN "document_type";

-- AlterTable sales: enum -> FK
ALTER TABLE "sales"
    ADD COLUMN "document_type_id" INTEGER;

UPDATE "sales"
SET "document_type_id" = CASE "document_type"
    WHEN 'FACTURA' THEN 1
    WHEN 'GUIA_REMISION' THEN 4
    WHEN 'NOTA_CREDITO' THEN 5
    WHEN 'NOTA_DEBITO' THEN 6
    WHEN 'RETENCION' THEN 7
    ELSE 1
END;

ALTER TABLE "sales"
    ALTER COLUMN "document_type_id" SET NOT NULL,
    DROP COLUMN "document_type";

-- Indexes
CREATE UNIQUE INDEX "document_types_document_name_key" ON "document_types"("document_name");
CREATE INDEX "document_types_active_idx" ON "document_types"("active");

CREATE UNIQUE INDEX "terminal_settings_terminal_id_document_type_id_key" ON "terminal_settings"("terminal_id", "document_type_id");
CREATE INDEX "terminal_settings_document_type_id_idx" ON "terminal_settings"("document_type_id");

CREATE UNIQUE INDEX "invoice_sequences_establishment_point_of_sale_document_type_id_key" ON "invoice_sequences"("establishment", "point_of_sale", "document_type_id");
CREATE INDEX "invoice_sequences_document_type_id_idx" ON "invoice_sequences"("document_type_id");

CREATE INDEX "sales_document_type_id_idx" ON "sales"("document_type_id");

-- Foreign keys
ALTER TABLE "terminal_settings"
    ADD CONSTRAINT "terminal_settings_document_type_id_fkey"
    FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoice_sequences"
    ADD CONSTRAINT "invoice_sequences_document_type_id_fkey"
    FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales"
    ADD CONSTRAINT "sales_document_type_id_fkey"
    FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop enum type now unused
DROP TYPE "DocumentType";
