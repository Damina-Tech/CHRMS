ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "keycloakSub" TEXT, ADD COLUMN "keycloakIssuer" TEXT;
CREATE UNIQUE INDEX "User_keycloakSub_key" ON "User"("keycloakSub");
