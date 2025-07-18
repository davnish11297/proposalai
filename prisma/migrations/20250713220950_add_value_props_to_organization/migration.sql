-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "valueProps" TEXT[];
