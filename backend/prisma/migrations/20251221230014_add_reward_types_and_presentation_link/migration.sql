/*
  Warnings:

  - You are about to drop the column `description` on the `categories` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(60)`.
  - You are about to drop the column `description` on the `customer_categories` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `payment_methods` table. All the data in the column will be lost.
  - Added the required column `reward_type` to the `rewards` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('PRODUCT', 'DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED', 'COUPON');

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "description",
ALTER COLUMN "name" SET DATA TYPE VARCHAR(60);

-- AlterTable
ALTER TABLE "customer_categories" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "payment_methods" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "rewards" ADD COLUMN     "discount_value" DECIMAL(10,2),
ADD COLUMN     "presentation_id" TEXT,
ADD COLUMN     "reward_type" "RewardType" NOT NULL,
ADD COLUMN     "terms" TEXT;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
