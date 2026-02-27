-- Create tenant theme storage for global and organization branding.
CREATE TABLE "OrganizationTheme" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'organization',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT,
    "tokens" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationTheme_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrganizationTheme_organizationId_idx" ON "OrganizationTheme"("organizationId");
CREATE INDEX "OrganizationTheme_scope_status_idx" ON "OrganizationTheme"("scope", "status");
CREATE UNIQUE INDEX "OrganizationTheme_organizationId_scope_version_key" ON "OrganizationTheme"("organizationId", "scope", "version");

ALTER TABLE "OrganizationTheme"
ADD CONSTRAINT "OrganizationTheme_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
