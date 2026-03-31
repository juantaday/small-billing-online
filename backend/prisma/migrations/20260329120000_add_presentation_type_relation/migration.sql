-- CreateTable
CREATE TABLE "presentation_types" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presentation_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presentation_types_name_key" ON "presentation_types"("name");

-- AddColumn
ALTER TABLE "presentations" ADD COLUMN "presentation_type_id" TEXT;

-- Backfill presentation types from current presentation names
INSERT INTO "presentation_types" ("id", "name", "active", "created_at", "updated_at")
SELECT CONCAT('ptype_', md5("name")), "name", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "name"
  FROM "presentations"
  WHERE "name" IS NOT NULL
) AS distinct_names;

-- Backfill FK using presentation name
UPDATE "presentations" p
SET "presentation_type_id" = pt."id"
FROM "presentation_types" pt
WHERE p."name" = pt."name";

-- Make FK required after backfill
ALTER TABLE "presentations" ALTER COLUMN "presentation_type_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "presentations"
ADD CONSTRAINT "presentations_presentation_type_id_fkey"
FOREIGN KEY ("presentation_type_id") REFERENCES "presentation_types"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old denormalized column
ALTER TABLE "presentations" DROP COLUMN "name";
