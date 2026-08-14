-- CreateEnum
CREATE TYPE "ExchangeState" AS ENUM ('CREATED', 'OPERATOR_IDENTIFIED', 'NEEDLE_SELECTED', 'EXCHANGE_TYPE_SELECTED', 'FRAGMENT_CHECK', 'CONFIRMATION_PENDING', 'EVIDENCE_CAPTURED', 'NEW_NEEDLE_SELECTED', 'NEEDLE_ISSUED', 'USED_NEEDLE_STORED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FragmentStatus" AS ENUM ('FOUND', 'NOT_FOUND');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('OLD_NEEDLE', 'BROKEN_FRAGMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConfirmationDecisionType" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RECEIVING', 'ISSUE', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'ADJUSTMENT', 'REVERSAL');

-- CreateTable
CREATE TABLE "exchanges" (
    "id" UUID NOT NULL,
    "exchange_number" VARCHAR(50) NOT NULL,
    "client_transaction_id" VARCHAR(100) NOT NULL,
    "factory_id" UUID NOT NULL,
    "trolley_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "pic_user_id" UUID NOT NULL,
    "old_needle_type_id" UUID NOT NULL,
    "exchange_type_id" UUID NOT NULL,
    "new_needle_type_id" UUID,
    "fragment_status" "FragmentStatus",
    "status" "ExchangeState" NOT NULL DEFAULT 'CREATED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_evidence" (
    "id" UUID NOT NULL,
    "exchange_id" UUID NOT NULL,
    "evidence_type" "EvidenceType" NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255),
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT,
    "checksum" VARCHAR(128),
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6),
    "uploaded_by" UUID NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmations" (
    "id" UUID NOT NULL,
    "confirmation_number" VARCHAR(50) NOT NULL,
    "exchange_id" UUID NOT NULL,
    "requested_to_user_id" UUID NOT NULL,
    "status" "ConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmation_decisions" (
    "id" UUID NOT NULL,
    "confirmation_id" UUID NOT NULL,
    "decision" "ConfirmationDecisionType" NOT NULL,
    "decided_by" UUID NOT NULL,
    "reason" TEXT,
    "decided_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirmation_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "movement_number" VARCHAR(50) NOT NULL,
    "movement_type" "MovementType" NOT NULL,
    "factory_id" UUID NOT NULL,
    "source_location_id" UUID,
    "destination_location_id" UUID,
    "needle_type_id" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "reference_type" VARCHAR(40) NOT NULL,
    "reference_id" UUID NOT NULL,
    "reason" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_user_id" UUID,
    "actor_device_id" UUID,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" UUID,
    "factory_id" UUID,
    "request_id" VARCHAR(100),
    "before_data" JSONB,
    "after_data" JSONB,
    "metadata" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "actor_user_id" UUID,
    "device_id" VARCHAR(128),
    "endpoint" VARCHAR(255) NOT NULL,
    "request_hash" VARCHAR(128) NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" UUID NOT NULL,
    "scope" VARCHAR(50) NOT NULL,
    "date" DATE NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_exchange_number_key" ON "exchanges"("exchange_number");

-- CreateIndex
CREATE INDEX "exchanges_client_transaction_id_idx" ON "exchanges"("client_transaction_id");

-- CreateIndex
CREATE INDEX "exchanges_factory_id_created_at_idx" ON "exchanges"("factory_id", "created_at");

-- CreateIndex
CREATE INDEX "exchanges_trolley_id_created_at_idx" ON "exchanges"("trolley_id", "created_at");

-- CreateIndex
CREATE INDEX "exchanges_operator_id_created_at_idx" ON "exchanges"("operator_id", "created_at");

-- CreateIndex
CREATE INDEX "exchanges_status_idx" ON "exchanges"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_device_id_client_transaction_id_key" ON "exchanges"("device_id", "client_transaction_id");

-- CreateIndex
CREATE INDEX "exchange_evidence_exchange_id_idx" ON "exchange_evidence"("exchange_id");

-- CreateIndex
CREATE UNIQUE INDEX "confirmations_confirmation_number_key" ON "confirmations"("confirmation_number");

-- CreateIndex
CREATE UNIQUE INDEX "confirmations_exchange_id_key" ON "confirmations"("exchange_id");

-- CreateIndex
CREATE INDEX "confirmations_status_idx" ON "confirmations"("status");

-- CreateIndex
CREATE INDEX "confirmations_requested_to_user_id_idx" ON "confirmations"("requested_to_user_id");

-- CreateIndex
CREATE INDEX "confirmations_due_at_idx" ON "confirmations"("due_at");

-- CreateIndex
CREATE INDEX "confirmation_decisions_confirmation_id_idx" ON "confirmation_decisions"("confirmation_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_movement_number_key" ON "stock_movements"("movement_number");

-- CreateIndex
CREATE INDEX "stock_movements_factory_id_created_at_idx" ON "stock_movements"("factory_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_needle_type_id_created_at_idx" ON "stock_movements"("needle_type_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_reference_type_reference_id_idx" ON "stock_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_timestamp_idx" ON "audit_logs"("actor_user_id", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_factory_id_timestamp_idx" ON "audit_logs"("factory_id", "timestamp");

-- CreateIndex
CREATE INDEX "idempotency_keys_idempotency_key_idx" ON "idempotency_keys"("idempotency_key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_idempotency_key_endpoint_key" ON "idempotency_keys"("idempotency_key", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_scope_date_key" ON "number_sequences"("scope", "date");

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_trolley_id_fkey" FOREIGN KEY ("trolley_id") REFERENCES "trolleys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_pic_user_id_fkey" FOREIGN KEY ("pic_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_old_needle_type_id_fkey" FOREIGN KEY ("old_needle_type_id") REFERENCES "needle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_new_needle_type_id_fkey" FOREIGN KEY ("new_needle_type_id") REFERENCES "needle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_exchange_type_id_fkey" FOREIGN KEY ("exchange_type_id") REFERENCES "exchange_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_evidence" ADD CONSTRAINT "exchange_evidence_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_evidence" ADD CONSTRAINT "exchange_evidence_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmations" ADD CONSTRAINT "confirmations_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmations" ADD CONSTRAINT "confirmations_requested_to_user_id_fkey" FOREIGN KEY ("requested_to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmation_decisions" ADD CONSTRAINT "confirmation_decisions_confirmation_id_fkey" FOREIGN KEY ("confirmation_id") REFERENCES "confirmations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmation_decisions" ADD CONSTRAINT "confirmation_decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_needle_type_id_fkey" FOREIGN KEY ("needle_type_id") REFERENCES "needle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Manually added: Prisma's schema language cannot express CHECK constraints.

-- Docs/11 §21: quantity is a positive magnitude; direction comes from
-- movement_type plus the source/destination pair, never from a negative number.
ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_quantity_positive" CHECK ("quantity" > 0);

-- Docs/11 §19 leaves "reason mandatory on rejection" to the backend. Enforcing
-- it here too means no service, migration or manual fix can record a rejection
-- without one.
ALTER TABLE "confirmation_decisions"
  ADD CONSTRAINT "confirmation_decisions_reject_requires_reason"
  CHECK ("decision" <> 'REJECTED' OR ("reason" IS NOT NULL AND btrim("reason") <> ''));

-- Counters only ever move forward.
ALTER TABLE "number_sequences"
  ADD CONSTRAINT "number_sequences_last_value_non_negative" CHECK ("last_value" >= 0);
