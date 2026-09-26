-- AlterTable
ALTER TABLE "VariantSubtitle" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "VariantSubtitle" ADD COLUMN     "vttContent" TEXT;
