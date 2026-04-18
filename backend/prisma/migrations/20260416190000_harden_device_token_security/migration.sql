-- Harden device token management:
-- 1) token is stored hashed in DB
-- 2) pairing challenge lifecycle
-- 3) rotation/revocation metadata

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum for device lifecycle
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeviceStatus') THEN
    CREATE TYPE "DeviceStatus" AS ENUM ('PENDING', 'PAIRED', 'REVOKED', 'RETIRED');
  END IF;
END $$;

ALTER TABLE "devices"
  ADD COLUMN "token_last4" VARCHAR(4),
  ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "token_issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "token_rotated_at" TIMESTAMP(3),
  ADD COLUMN "token_revoked_at" TIMESTAMP(3),
  ADD COLUMN "revoke_reason" VARCHAR(255),
  ADD COLUMN "pairing_code" VARCHAR(10),
  ADD COLUMN "pairing_code_expires_at" TIMESTAMP(3),
  ADD COLUMN "pairing_code_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "fingerprint_signal" VARCHAR(128),
  ADD COLUMN "risk_score" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "risk_signals" JSONB,
  ADD COLUMN "status" "DeviceStatus" NOT NULL DEFAULT 'PENDING';

-- Convert legacy plain-text token -> SHA-256 hash and preserve last4 for operations UI
WITH source_tokens AS (
  SELECT id, device_token AS raw_token, active
  FROM "devices"
)
UPDATE "devices" d
SET
  "device_token" = encode(digest(s.raw_token, 'sha256'), 'hex'),
  "token_last4" = right(s.raw_token, 4),
  "status" = CASE
    WHEN s.active THEN 'PAIRED'::"DeviceStatus"
    ELSE 'REVOKED'::"DeviceStatus"
  END,
  "token_revoked_at" = CASE
    WHEN s.active THEN NULL
    ELSE COALESCE(d."updated_at", CURRENT_TIMESTAMP)
  END
FROM source_tokens s
WHERE d.id = s.id;

ALTER TABLE "devices"
  ALTER COLUMN "token_last4" SET NOT NULL;

CREATE UNIQUE INDEX "devices_pairing_code_key" ON "devices"("pairing_code");
CREATE INDEX "devices_status_idx" ON "devices"("status");
CREATE INDEX "devices_pairing_code_expires_at_idx" ON "devices"("pairing_code_expires_at");
