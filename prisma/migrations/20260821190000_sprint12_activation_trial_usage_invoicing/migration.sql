-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "billingContactEmail" TEXT,
ADD COLUMN     "billingContactName" TEXT,
ADD COLUMN     "billingMethod" TEXT NOT NULL DEFAULT 'card',
ADD COLUMN     "billingReference" TEXT,
ADD COLUMN     "cvrNumber" TEXT,
ADD COLUMN     "eanNumber" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "durationSeconds" INTEGER;

-- CreateTable
CREATE TABLE "OrganizationActivation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "intendedPlan" TEXT,
    "projectCreated" TIMESTAMP(3),
    "variantUploaded" TIMESTAMP(3),
    "embedCopied" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMonth" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "playStarts" INTEGER NOT NULL DEFAULT 0,
    "deliveryMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "eanNumber" TEXT NOT NULL,
    "cvrNumber" TEXT,
    "billingContactName" TEXT,
    "billingContactEmail" TEXT NOT NULL,
    "billingReference" TEXT,
    "note" TEXT,
    "requestedByUserId" TEXT,
    "handledByUserId" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationActivation_organizationId_key" ON "OrganizationActivation"("organizationId");

-- CreateIndex
CREATE INDEX "UsageMonth_organizationId_idx" ON "UsageMonth"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageMonth_organizationId_yearMonth_key" ON "UsageMonth"("organizationId", "yearMonth");

-- CreateIndex
CREATE INDEX "InvoiceRequest_organizationId_idx" ON "InvoiceRequest"("organizationId");

-- CreateIndex
CREATE INDEX "InvoiceRequest_status_idx" ON "InvoiceRequest"("status");

-- AddForeignKey
ALTER TABLE "OrganizationActivation" ADD CONSTRAINT "OrganizationActivation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMonth" ADD CONSTRAINT "UsageMonth_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRequest" ADD CONSTRAINT "InvoiceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Datamigrering: sikr at ingen eksisterende organisation mister adgang.
-- Alle organisationer får en aktiveringsrække, så tilstanden kan læses ét sted.
INSERT INTO "OrganizationActivation" ("id", "organizationId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, o."id", NOW(), NOW()
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "OrganizationActivation" a WHERE a."organizationId" = o."id"
);

-- Organisationer helt uden abonnement ville ellers blive læst som "udløbet"
-- og få deres embeds slukket. De får en prøveperiode i stedet.
INSERT INTO "Subscription" ("id", "organizationId", "plan", "status", "trialEndsAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, o."id", 'trial', 'trialing', NOW() + INTERVAL '10 days', NOW(), NOW()
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "Subscription" s WHERE s."organizationId" = o."id"
);

-- Eksisterende abonnementer på den gamle gratisplan havde alligevel ingen afspilning.
-- De får samme prøveperiode, så de kan nå at vælge en rigtig plan.
UPDATE "Subscription"
SET "plan" = 'trial',
    "status" = 'trialing',
    "trialEndsAt" = NOW() + INTERVAL '10 days',
    "updatedAt" = NOW()
WHERE "plan" = 'free' AND "trialEndsAt" IS NULL;
