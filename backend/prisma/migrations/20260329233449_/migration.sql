/*
  Warnings:

  - You are about to alter the column `name` on the `presentation_types` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(35)`.

*/
-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'TRANSFER', 'CARD', 'CREDIT');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VISA', 'MASTERCARD', 'AMERICAN_EXPRESS', 'DINERS_CLUB', 'DISCOVER', 'OTHER');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'CREDIT', 'PARTIAL_PAYMENT');

-- AlterTable
ALTER TABLE "presentation_types" ALTER COLUMN "name" SET DATA TYPE VARCHAR(35);

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_sequences" (
    "id" TEXT NOT NULL,
    "establishment" VARCHAR(3) NOT NULL,
    "point_of_sale" VARCHAR(3) NOT NULL,
    "last_sequential" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "invoice_number" VARCHAR(17) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "SaleStatus" NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_details" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "presentation_id" TEXT NOT NULL,
    "product_name" VARCHAR(100) NOT NULL,
    "presentation_name" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_product_taxes" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "presentation_id" TEXT NOT NULL,
    "tax_code" VARCHAR(10) NOT NULL,
    "tax_description" VARCHAR(255) NOT NULL,
    "tax_percentage" DECIMAL(5,2) NOT NULL,
    "taxable_amount" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_product_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "payment_type" "PaymentMethodType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "cash_received" DECIMAL(10,2),
    "change" DECIMAL(10,2),
    "bank_id" TEXT,
    "bank_account" VARCHAR(50),
    "transfer_reference" VARCHAR(100),
    "card_type" "CardType",
    "voucher_number" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credits" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_payments" (
    "id" TEXT NOT NULL,
    "credit_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_type" "PaymentMethodType" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bank_id" TEXT,
    "bank_account" VARCHAR(50),
    "transfer_reference" VARCHAR(100),
    "card_type" "CardType",
    "voucher_number" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_code_key" ON "banks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_sequences_establishment_point_of_sale_key" ON "invoice_sequences"("establishment", "point_of_sale");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoice_number_key" ON "sales"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "credits_sale_id_key" ON "credits"("sale_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_product_taxes" ADD CONSTRAINT "sale_product_taxes_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_product_taxes" ADD CONSTRAINT "sale_product_taxes_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
