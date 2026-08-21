-- CreateTable
CREATE TABLE "VariantSubtitle" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "languageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'generated',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "muxTrackId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantSubtitle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VariantSubtitle_variantId_idx" ON "VariantSubtitle"("variantId");

-- CreateIndex
CREATE INDEX "VariantSubtitle_organizationId_idx" ON "VariantSubtitle"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantSubtitle_variantId_languageCode_key" ON "VariantSubtitle"("variantId", "languageCode");

-- AddForeignKey
ALTER TABLE "VariantSubtitle" ADD CONSTRAINT "VariantSubtitle_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantSubtitle" ADD CONSTRAINT "VariantSubtitle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

