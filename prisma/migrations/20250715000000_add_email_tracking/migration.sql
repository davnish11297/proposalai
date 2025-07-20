-- Add email tracking fields to proposals table
ALTER TABLE "proposals" ADD COLUMN "emailSentAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN "emailRecipient" TEXT;
ALTER TABLE "proposals" ADD COLUMN "emailMessageId" TEXT;
ALTER TABLE "proposals" ADD COLUMN "emailOpenedAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN "emailRepliedAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN "emailClickedAt" TIMESTAMP(3);
ALTER TABLE "proposals" ADD COLUMN "emailTrackingId" TEXT UNIQUE;
ALTER TABLE "proposals" ADD COLUMN "emailStatus" TEXT DEFAULT 'SENT'; 