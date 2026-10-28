-- Property: optional code, optional rooms, drop condition
ALTER TABLE "Property" ALTER COLUMN "code" DROP NOT NULL;
ALTER TABLE "Property" ALTER COLUMN "rooms" DROP NOT NULL;
ALTER TABLE "Property" DROP COLUMN IF EXISTS "condition";

-- Clear rooms on commercial stock
UPDATE "Property" SET "rooms" = NULL WHERE "type" = 'commercial';

-- Tenant address
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Rental: agreement file + required unique agreement numbers
ALTER TABLE "Rental" ADD COLUMN IF NOT EXISTS "agreement_file" TEXT;

-- Backfill unique agreement numbers where missing (use full id)
UPDATE "Rental"
SET "agreement_number" = 'RA-LEGACY-' || REPLACE("id", '-', '')
WHERE "agreement_number" IS NULL OR TRIM("agreement_number") = '';

ALTER TABLE "Rental" ALTER COLUMN "agreement_number" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Rental_agreement_number_key" ON "Rental"("agreement_number");

ALTER TABLE "Rental" DROP COLUMN IF EXISTS "due_day";
