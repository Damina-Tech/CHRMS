-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('saving', 'kebele', 'condominium');

-- AlterTable Property: category + GPS
ALTER TABLE "Property" ADD COLUMN "category" "PropertyCategory",
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7);

-- Unique house number within woreda + kebele
CREATE UNIQUE INDEX "property_address_unique" ON "Property"("woreda", "kebele", "house_number");

-- AlterTable Rental: agreement reference
ALTER TABLE "Rental" ADD COLUMN "agreement_number" TEXT;
