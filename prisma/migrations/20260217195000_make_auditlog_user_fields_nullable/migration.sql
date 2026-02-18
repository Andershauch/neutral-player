-- Make legacy strict audit columns nullable for system/webhook events
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "userName" DROP NOT NULL;
