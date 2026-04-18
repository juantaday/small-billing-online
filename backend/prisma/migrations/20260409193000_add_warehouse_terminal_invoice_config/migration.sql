-- CreateTable
CREATE TABLE "warehouses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "establishment_code" VARCHAR(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminals" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "emission_point" VARCHAR(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN "terminal_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_establishment_code_key" ON "warehouses"("establishment_code");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_code_key" ON "terminals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_warehouse_id_emission_point_key" ON "terminals"("warehouse_id", "emission_point");

-- CreateIndex
CREATE INDEX "terminals_warehouse_id_idx" ON "terminals"("warehouse_id");

-- CreateIndex
CREATE INDEX "terminals_warehouse_id_active_idx" ON "terminals"("warehouse_id", "active");

-- CreateIndex
CREATE INDEX "sales_terminal_id_idx" ON "sales"("terminal_id");

-- AddForeignKey
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
