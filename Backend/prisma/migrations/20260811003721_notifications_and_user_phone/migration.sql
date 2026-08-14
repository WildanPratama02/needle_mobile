-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONFIRMATION_REQUESTED', 'CONFIRMATION_DECIDED', 'EXCHANGE_STUCK');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_number" VARCHAR(32);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'WHATSAPP',
    "recipient_user_id" UUID,
    "recipient_reference" VARCHAR(64),
    "exchange_id" UUID,
    "confirmation_id" UUID,
    "template_code" VARCHAR(64) NOT NULL,
    "payload" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "provider_message_id" VARCHAR(128),
    "failure_reason" TEXT,
    "dedupe_key" VARCHAR(255) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_exchange_id_idx" ON "notifications"("exchange_id");

-- CreateIndex
CREATE INDEX "notifications_confirmation_id_idx" ON "notifications"("confirmation_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_confirmation_id_fkey" FOREIGN KEY ("confirmation_id") REFERENCES "confirmations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
