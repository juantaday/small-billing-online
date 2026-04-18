-- Move terminal-device relation to Terminal side (required 1:1)

-- 1) Add new FK column on terminals (nullable during backfill)
ALTER TABLE "terminals"
  ADD COLUMN "device_id" TEXT;

-- 2) Backfill from legacy devices.terminal_id (pick one device per terminal)
WITH ranked_devices AS (
  SELECT
    d.id AS device_id,
    d.terminal_id,
    ROW_NUMBER() OVER (
      PARTITION BY d.terminal_id
      ORDER BY d.active DESC, d.last_seen DESC, d.created_at ASC, d.id ASC
    ) AS rn
  FROM "devices" d
  WHERE d.terminal_id IS NOT NULL
)
UPDATE "terminals" t
SET "device_id" = rd.device_id
FROM ranked_devices rd
WHERE t.id = rd.terminal_id
  AND rd.rn = 1;

-- 3) Create synthetic devices for orphan terminals to satisfy NOT NULL + 1:1 constraint
INSERT INTO "devices" (
  "id",
  "device_token",
  "device_name",
  "active",
  "last_seen",
  "created_at",
  "updated_at"
)
SELECT
  'mig_device_terminal_' || t.id::text,
  md5('terminal-' || t.id::text || '-token-a') || md5('terminal-' || t.id::text || '-token-b'),
  'Migrated device for terminal ' || t.code,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "terminals" t
WHERE t.device_id IS NULL;

UPDATE "terminals" t
SET "device_id" = 'mig_device_terminal_' || t.id::text
WHERE t.device_id IS NULL;

-- 4) Enforce one-to-one and mandatory relation
ALTER TABLE "terminals"
  ALTER COLUMN "device_id" SET NOT NULL;

CREATE UNIQUE INDEX "terminals_device_id_key" ON "terminals"("device_id");
CREATE INDEX "terminals_device_id_idx" ON "terminals"("device_id");

ALTER TABLE "terminals"
  ADD CONSTRAINT "terminals_device_id_fkey"
  FOREIGN KEY ("device_id") REFERENCES "devices"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Remove legacy relation from devices
ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_terminal_id_fkey";
DROP INDEX IF EXISTS "devices_terminal_id_idx";
ALTER TABLE "devices" DROP COLUMN IF EXISTS "terminal_id";
