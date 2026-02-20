-- CreateTable
CREATE TABLE "MuxWebhookEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "muxEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuxWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuxWebhookEvent_muxEventId_key" ON "MuxWebhookEvent"("muxEventId");

-- CreateIndex
CREATE INDEX "MuxWebhookEvent_organizationId_idx" ON "MuxWebhookEvent"("organizationId");

-- AddForeignKey
ALTER TABLE "MuxWebhookEvent" ADD CONSTRAINT "MuxWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
