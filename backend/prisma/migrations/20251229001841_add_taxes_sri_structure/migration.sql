-- AlterTable
ALTER TABLE "products" ADD COLUMN     "default_purchase_presentation_id" TEXT,
ADD COLUMN     "default_sale_presentation_id" TEXT;

-- CreateTable
CREATE TABLE "taxes" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_values" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "tax_id" TEXT NOT NULL,
    "percentage" DECIMAL(18,2) NOT NULL,
    "retention_percentage" DECIMAL(18,3),
    "tax_type" VARCHAR(1) NOT NULL,
    "description" VARCHAR(600) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "admin_code" INTEGER NOT NULL,
    "free_percentage_mark" VARCHAR(1) NOT NULL,
    "calculate_with_quantity" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_taxes" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tax_value_code" VARCHAR(255) NOT NULL,
    "custom_percent" DECIMAL(5,4),
    "is_default_vat" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taxes_code_key" ON "taxes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_values_code_key" ON "tax_values"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_taxes_product_id_tax_value_code_key" ON "product_taxes"("product_id", "tax_value_code");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_default_purchase_presentation_id_fkey" FOREIGN KEY ("default_purchase_presentation_id") REFERENCES "presentations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_default_sale_presentation_id_fkey" FOREIGN KEY ("default_sale_presentation_id") REFERENCES "presentations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_values" ADD CONSTRAINT "tax_values_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_taxes" ADD CONSTRAINT "product_taxes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_taxes" ADD CONSTRAINT "product_taxes_tax_value_code_fkey" FOREIGN KEY ("tax_value_code") REFERENCES "tax_values"("code") ON DELETE CASCADE ON UPDATE CASCADE;
