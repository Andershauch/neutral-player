-- CreateTable
CREATE TABLE "MarketingPage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activeDraftId" TEXT,
    "publishedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPageVersion" (
    "id" TEXT NOT NULL,
    "marketingPageId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "changeSummary" TEXT,
    "createdByUserId" TEXT,
    "publishedByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingAsset" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "altText" TEXT,
    "title" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" JSONB,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPage_key_key" ON "MarketingPage"("key");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPage_activeDraftId_key" ON "MarketingPage"("activeDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPage_publishedVersionId_key" ON "MarketingPage"("publishedVersionId");

-- CreateIndex
CREATE INDEX "MarketingPage_key_idx" ON "MarketingPage"("key");

-- CreateIndex
CREATE INDEX "MarketingPageVersion_marketingPageId_status_idx" ON "MarketingPageVersion"("marketingPageId", "status");

-- CreateIndex
CREATE INDEX "MarketingPageVersion_marketingPageId_publishedAt_idx" ON "MarketingPageVersion"("marketingPageId", "publishedAt");

-- CreateIndex
CREATE INDEX "MarketingPageVersion_createdByUserId_idx" ON "MarketingPageVersion"("createdByUserId");

-- CreateIndex
CREATE INDEX "MarketingPageVersion_publishedByUserId_idx" ON "MarketingPageVersion"("publishedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPageVersion_marketingPageId_version_key" ON "MarketingPageVersion"("marketingPageId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingAsset_key_key" ON "MarketingAsset"("key");

-- CreateIndex
CREATE INDEX "MarketingAsset_kind_idx" ON "MarketingAsset"("kind");

-- CreateIndex
CREATE INDEX "MarketingAsset_uploadedByUserId_idx" ON "MarketingAsset"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "MarketingPage" ADD CONSTRAINT "MarketingPage_activeDraftId_fkey" FOREIGN KEY ("activeDraftId") REFERENCES "MarketingPageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPage" ADD CONSTRAINT "MarketingPage_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "MarketingPageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPageVersion" ADD CONSTRAINT "MarketingPageVersion_marketingPageId_fkey" FOREIGN KEY ("marketingPageId") REFERENCES "MarketingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPageVersion" ADD CONSTRAINT "MarketingPageVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPageVersion" ADD CONSTRAINT "MarketingPageVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingAsset" ADD CONSTRAINT "MarketingAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
