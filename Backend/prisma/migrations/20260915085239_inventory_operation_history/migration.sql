-- CreateEnum
CREATE TYPE "StockRelocationKind" AS ENUM ('TRANSFER', 'RETURN');

-- CreateEnum
CREATE TYPE "AdjustmentReasonCode" AS ENUM ('PHYSICAL_COUNT', 'DAMAGED', 'LOST', 'DATA_CORRECTION', 'OTHER');

-- AlterEnum
ALTER TYPE "CountSessionStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "count_sessions" ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "stock_relocations" (
    "id" UUID NOT NULL,
    "kind" "StockRelocationKind" NOT NULL,
    "factory_id" UUID NOT NULL,
    "source_location_id" UUID NOT NULL,
    "destination_location_id" UUID NOT NULL,
    "needle_type_id" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "out_movement_id" UUID NOT NULL,
    "in_movement_id" UUID NOT NULL,
    "reference_document" VARCHAR(100),
    "note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_relocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" UUID NOT NULL,
    "factory_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "needle_type_id" UUID NOT NULL,
    "reason_code" "AdjustmentReasonCode" NOT NULL,
    "note" TEXT,
    "system_quantity" DECIMAL(18,3),
    "actual_quantity" DECIMAL(18,3),
    "variance_quantity" DECIMAL(18,3) NOT NULL,
    "count_session_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment_evidence" (
    "id" UUID NOT NULL,
    "factory_id" UUID NOT NULL,
    "adjustment_id" UUID,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "checksum" VARCHAR(128),
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustment_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_relocations_out_movement_id_key" ON "stock_relocations"("out_movement_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_relocations_in_movement_id_key" ON "stock_relocations"("in_movement_id");

-- CreateIndex
CREATE INDEX "stock_relocations_factory_id_kind_created_at_idx" ON "stock_relocations"("factory_id", "kind", "created_at");

-- CreateIndex
CREATE INDEX "stock_adjustments_factory_id_created_at_idx" ON "stock_adjustments"("factory_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_adjustments_count_session_id_idx" ON "stock_adjustments"("count_session_id");

-- CreateIndex
CREATE INDEX "stock_adjustment_evidence_adjustment_id_idx" ON "stock_adjustment_evidence"("adjustment_id");

-- AddForeignKey
ALTER TABLE "stock_relocations" ADD CONSTRAINT "stock_relocations_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_relocations" ADD CONSTRAINT "stock_relocations_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_relocations" ADD CONSTRAINT "stock_relocations_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_relocations" ADD CONSTRAINT "stock_relocations_needle_type_id_fkey" FOREIGN KEY ("needle_type_id") REFERENCES "needle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_relocations" ADD CONSTRAINT "stock_relocations_out_movement_id_fkey" FOREIGN KEY ("out_movement_id") REFERENCES "stock_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_relocations" ADD CONSTRAINT "stock_relocations_in_movement_id_fkey" FOREIGN KEY ("in_movement_id") REFERENCES "stock_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_relocations" ADD CONSTRAINT "stock_relocations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_id_fkey" FOREIGN KEY ("id") REFERENCES "stock_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_needle_type_id_fkey" FOREIGN KEY ("needle_type_id") REFERENCES "needle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_count_session_id_fkey" FOREIGN KEY ("count_session_id") REFERENCES "count_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_evidence" ADD CONSTRAINT "stock_adjustment_evidence_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_evidence" ADD CONSTRAINT "stock_adjustment_evidence_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_evidence" ADD CONSTRAINT "stock_adjustment_evidence_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: one header per existing Transfer / Return movement pair. The OUT
-- row carries the source, the IN row the destination; both share referenceId.
INSERT INTO "stock_relocations" (
    "id", "kind", "factory_id", "source_location_id", "destination_location_id",
    "needle_type_id", "quantity", "out_movement_id", "in_movement_id",
    "reference_document", "note", "created_by", "created_at"
)
SELECT
    o."reference_id", o."reference_type"::"StockRelocationKind", o."factory_id",
    o."source_location_id", i."destination_location_id", o."needle_type_id", o."quantity",
    o."id", i."id", NULL, o."reason", o."created_by", o."created_at"
FROM "stock_movements" o
JOIN "stock_movements" i
  ON i."reference_id" = o."reference_id"
 AND i."reference_type" = o."reference_type"
 AND i."id" <> o."id"
 AND i."destination_location_id" IS NOT NULL
WHERE o."reference_type" IN ('TRANSFER', 'RETURN')
  AND o."source_location_id" IS NOT NULL;

-- Backfill: one header per existing ADJUSTMENT movement. Count-session
-- adjustments recover their quantities from the counted item; manual ones made
-- before this migration cannot, so theirs stay NULL and their code is OTHER.
INSERT INTO "stock_adjustments" (
    "id", "factory_id", "location_id", "needle_type_id", "reason_code", "note",
    "system_quantity", "actual_quantity", "variance_quantity", "count_session_id",
    "created_by", "created_at"
)
SELECT
    m."id", m."factory_id", COALESCE(m."source_location_id", m."destination_location_id"),
    m."needle_type_id",
    (CASE WHEN m."reference_type" = 'COUNT_SESSION' THEN 'PHYSICAL_COUNT' ELSE 'OTHER' END)::"AdjustmentReasonCode",
    CASE WHEN m."reference_type" = 'COUNT_SESSION' THEN NULL ELSE m."reason" END,
    csi."system_quantity", csi."physical_quantity",
    CASE WHEN m."source_location_id" IS NOT NULL THEN -m."quantity" ELSE m."quantity" END,
    CASE WHEN m."reference_type" = 'COUNT_SESSION' THEN m."reference_id" END,
    m."created_by", m."created_at"
FROM "stock_movements" m
LEFT JOIN "count_sessions" cs
  ON m."reference_type" = 'COUNT_SESSION' AND cs."id" = m."reference_id"
LEFT JOIN "count_session_items" csi
  ON csi."count_session_id" = cs."id" AND csi."needle_type_id" = m."needle_type_id"
WHERE m."movement_type" = 'ADJUSTMENT';
