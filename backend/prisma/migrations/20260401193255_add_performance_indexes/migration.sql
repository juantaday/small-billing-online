-- CreateIndex
CREATE INDEX "presentations_product_id_active_idx" ON "presentations"("product_id", "active");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_taxes_product_id_idx" ON "product_taxes"("product_id");

-- CreateIndex
CREATE INDEX "product_taxes_product_id_active_idx" ON "product_taxes"("product_id", "active");
