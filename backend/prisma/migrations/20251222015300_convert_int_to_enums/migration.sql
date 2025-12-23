/*
  Warnings:

  - You are about to drop the column `long_description` on the `products` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `products` table. The data in that column could be lost. The data in that column will be cast from `VarChar(150)` to `VarChar(60)`.
  - You are about to alter the column `short_description` on the `products` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(20)`.
  - Changed the type of `person_type` on the `peoples` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `identity_type` on the `peoples` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `gender` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');
CREATE TYPE "PersonType" AS ENUM ('NATURAL', 'JURIDICA');
CREATE TYPE "IdentityType" AS ENUM ('CEDULA', 'RUC', 'PASAPORTE');

-- Paso 1: Agregar columnas temporales con los nuevos tipos enum
ALTER TABLE "peoples" 
  ADD COLUMN "person_type_new" "PersonType",
  ADD COLUMN "identity_type_new" "IdentityType";

ALTER TABLE "users"
  ADD COLUMN "gender_new" "Gender";

-- Paso 2: Convertir datos existentes de Int a Enum
-- PersonType: 1 -> NATURAL, 2 -> JURIDICA
UPDATE "peoples" SET "person_type_new" = 
  CASE "person_type"
    WHEN 1 THEN 'NATURAL'::"PersonType"
    WHEN 2 THEN 'JURIDICA'::"PersonType"
    ELSE 'NATURAL'::"PersonType"
  END;

-- IdentityType: 1 -> CEDULA, 2 -> RUC, 3 -> PASAPORTE
UPDATE "peoples" SET "identity_type_new" = 
  CASE "identity_type"
    WHEN 1 THEN 'CEDULA'::"IdentityType"
    WHEN 2 THEN 'RUC'::"IdentityType"
    WHEN 3 THEN 'PASAPORTE'::"IdentityType"
    ELSE 'CEDULA'::"IdentityType"
  END;

-- Gender: 1 -> MASCULINO, 2 -> FEMENINO, 3 -> OTRO
UPDATE "users" SET "gender_new" = 
  CASE "gender"
    WHEN 1 THEN 'MASCULINO'::"Gender"
    WHEN 2 THEN 'FEMENINO'::"Gender"
    WHEN 3 THEN 'OTRO'::"Gender"
    ELSE 'MASCULINO'::"Gender"
  END;

-- Paso 3: Hacer las columnas nuevas NOT NULL
ALTER TABLE "peoples" 
  ALTER COLUMN "person_type_new" SET NOT NULL,
  ALTER COLUMN "identity_type_new" SET NOT NULL;

ALTER TABLE "users"
  ALTER COLUMN "gender_new" SET NOT NULL;

-- Paso 4: Eliminar columnas antiguas y renombrar las nuevas
ALTER TABLE "peoples" 
  DROP COLUMN "person_type",
  DROP COLUMN "identity_type";

ALTER TABLE "peoples" 
  RENAME COLUMN "person_type_new" TO "person_type";

ALTER TABLE "peoples" 
  RENAME COLUMN "identity_type_new" TO "identity_type";

ALTER TABLE "users" 
  DROP COLUMN "gender";

ALTER TABLE "users" 
  RENAME COLUMN "gender_new" TO "gender";

-- Paso 5: Modificar productos (reducir tamaños de columnas)
ALTER TABLE "products" 
  DROP COLUMN IF EXISTS "long_description",
  ALTER COLUMN "name" SET DATA TYPE VARCHAR(60),
  ALTER COLUMN "short_description" SET DATA TYPE VARCHAR(20);

