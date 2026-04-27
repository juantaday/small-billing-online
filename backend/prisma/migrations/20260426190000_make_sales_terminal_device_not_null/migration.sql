-- Make terminal_id and device_id required on sales
ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_terminal_id_fkey";
ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_device_id_fkey";

ALTER TABLE "sales" ALTER COLUMN "terminal_id" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "device_id" SET NOT NULL;

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_terminal_id_fkey"
  FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_device_id_fkey"
  FOREIGN KEY ("device_id") REFERENCES "devices"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
