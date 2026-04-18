-- Create DocumentType enum
CREATE TYPE "DocumentType" AS ENUM ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'RETENCION', 'GUIA_REMISION');

-- Create LogoSize enum
CREATE TYPE "LogoSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- Create devices table
CREATE TABLE "devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "device_token" VARCHAR(64) NOT NULL UNIQUE,
    "device_name" VARCHAR(100),
    "ip_address" VARCHAR(45),
    "terminal_id" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "devices_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals" ("id") ON DELETE SET NULL
);

-- Create terminal_settings table
CREATE TABLE "terminal_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "terminal_id" INTEGER NOT NULL,
    "document_type" "DocumentType" NOT NULL DEFAULT 'FACTURA',
    "name_printer" VARCHAR(100),
    "character_line" INTEGER,
    "with_logo" "LogoSize",
    "max_items" INTEGER NOT NULL DEFAULT 100,
    "lines_per_transaction" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "terminal_settings_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals" ("id") ON DELETE CASCADE,
    UNIQUE ("terminal_id", "document_type")
);

-- Alter invoice_sequences to include documentType column
ALTER TABLE "invoice_sequences" ADD COLUMN "document_type" "DocumentType" NOT NULL DEFAULT 'FACTURA';

-- Drop old unique constraint
ALTER TABLE "invoice_sequences" DROP CONSTRAINT IF EXISTS "invoice_sequences_establishment_point_of_sale_key";

-- Add new unique constraint with documentType
ALTER TABLE "invoice_sequences" ADD CONSTRAINT "invoice_sequences_establishment_point_of_sale_document_type_key" UNIQUE ("establishment", "point_of_sale", "document_type");

-- Add columns to sales table
ALTER TABLE "sales" ADD COLUMN "document_type" "DocumentType" NOT NULL DEFAULT 'FACTURA';
ALTER TABLE "sales" ADD COLUMN "device_id" TEXT;

-- Add foreign key constraint for deviceId
ALTER TABLE "sales" ADD CONSTRAINT "sales_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE SET NULL;

-- Add indexes
CREATE INDEX "devices_terminal_id_idx" ON "devices" ("terminal_id");
CREATE INDEX "devices_active_idx" ON "devices" ("active");
CREATE INDEX "terminal_settings_terminal_id_idx" ON "terminal_settings" ("terminal_id");
CREATE INDEX "sales_device_id_idx" ON "sales" ("device_id");
CREATE INDEX "sales_document_type_idx" ON "sales" ("document_type");


