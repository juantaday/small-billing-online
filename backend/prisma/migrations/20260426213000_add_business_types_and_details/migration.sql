-- Add business type catalog and business details configuration
CREATE TYPE "BusinessTypeGroup" AS ENUM ('LEGAL_NATURE', 'TAX_REGIME', 'SPECIAL_DESIGNATION');

CREATE TABLE "business_types" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30),
    "name" VARCHAR(120) NOT NULL,
    "group" "BusinessTypeGroup" NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_types_group_name_key" ON "business_types" ("group", "name");
CREATE INDEX "business_types_group_idx" ON "business_types" ("group");

CREATE TABLE "business_details" (
    "id" TEXT NOT NULL,
    "ruc" VARCHAR(13) NOT NULL,
    "legal_name" VARCHAR(150) NOT NULL,
    "commercial_name" VARCHAR(150),
    "trade_name" VARCHAR(150),
    "phone" VARCHAR(30),
    "address" VARCHAR(255),
    "legal_nature_id" INTEGER NOT NULL,
    "tax_regime_id" INTEGER NOT NULL,
    "special_designation_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_details_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_details_ruc_key" ON "business_details" ("ruc");
CREATE INDEX "business_details_legal_nature_id_idx" ON "business_details" ("legal_nature_id");
CREATE INDEX "business_details_tax_regime_id_idx" ON "business_details" ("tax_regime_id");
CREATE INDEX "business_details_special_designation_id_idx" ON "business_details" ("special_designation_id");

ALTER TABLE "business_details" ADD CONSTRAINT "business_details_legal_nature_id_fkey" FOREIGN KEY ("legal_nature_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "business_details" ADD CONSTRAINT "business_details_tax_regime_id_fkey" FOREIGN KEY ("tax_regime_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "business_details" ADD CONSTRAINT "business_details_special_designation_id_fkey" FOREIGN KEY ("special_designation_id") REFERENCES "business_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed SRI business types
INSERT INTO "business_types" ("code", "name", "group", "description", "active") VALUES
  ('PN_NO_CONTAB', 'Persona natural no obligada a llevar contabilidad', 'LEGAL_NATURE', 'Personas naturales con obligaciones simplificadas.', true),
  ('PN_CONTAB', 'Persona natural obligada a llevar contabilidad', 'LEGAL_NATURE', 'Personas naturales que superan límites legales y deben llevar contabilidad.', true),
  ('SOC_PRIVADA', 'Sociedad privada', 'LEGAL_NATURE', 'Empresas privadas, cooperativas o fundaciones.', true),
  ('SOC_PUBLICA', 'Sociedad pública', 'LEGAL_NATURE', 'Instituciones del Estado y entidades públicas.', true),
  ('RIMPE_NEG_POP', 'RIMPE - Negocio Popular', 'TAX_REGIME', 'Hasta $20.000 de ingresos anuales. Cuota fija.', true),
  ('RIMPE_EMPRENDEDOR', 'RIMPE - Emprendedor', 'TAX_REGIME', 'Ingresos entre $20.001 y $300.000.', true),
    ('REGIMEN_GENERAL', 'Regimen General', 'TAX_REGIME', 'Ingresos superiores o actividades excluidas del RIMPE.', true),
  ('CONTRIB_ESPECIAL', 'Contribuyente especial', 'SPECIAL_DESIGNATION', 'Designación especial del SRI por volumen o riesgo fiscal.', true),
  ('GRAN_CONTRIB', 'Gran contribuyente', 'SPECIAL_DESIGNATION', 'Contribuyentes de mayor tamaño y control fiscal.', true);
