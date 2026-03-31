-- CreateEnum
CREATE TYPE "TaxDefaultGroup" AS ENUM ('IVA', 'ICE', 'IRBPNR');

-- CreateTable
CREATE TABLE "product_tax_defaults" (
    "id" TEXT NOT NULL,
    "tax_group" "TaxDefaultGroup" NOT NULL,
    "tax_value_code" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_tax_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_tax_defaults_tax_group_key" ON "product_tax_defaults"("tax_group");

-- AddForeignKey
ALTER TABLE "product_tax_defaults"
ADD CONSTRAINT "product_tax_defaults_tax_value_code_fkey"
FOREIGN KEY ("tax_value_code") REFERENCES "tax_values"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;
