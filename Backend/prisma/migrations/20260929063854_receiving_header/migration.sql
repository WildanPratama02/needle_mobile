-- CreateTable
CREATE TABLE "stock_receivings" (
    "id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "factory_id" UUID NOT NULL,
    "destination_location_id" UUID NOT NULL,
    "needle_type_id" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "supplier_id" UUID,
    "received_date" DATE NOT NULL,
    "reference_document" VARCHAR(100),
    "note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_receivings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_receivings_movement_id_key" ON "stock_receivings"("movement_id");

-- CreateIndex
CREATE INDEX "stock_receivings_factory_id_created_at_idx" ON "stock_receivings"("factory_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_receivings_supplier_id_idx" ON "stock_receivings"("supplier_id");

-- AddForeignKey
ALTER TABLE "stock_receivings" ADD CONSTRAINT "stock_receivings_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "stock_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receivings" ADD CONSTRAINT "stock_receivings_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receivings" ADD CONSTRAINT "stock_receivings_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receivings" ADD CONSTRAINT "stock_receivings_needle_type_id_fkey" FOREIGN KEY ("needle_type_id") REFERENCES "needle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receivings" ADD CONSTRAINT "stock_receivings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_receivings" ADD CONSTRAINT "stock_receivings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: one header per existing RECEIVING movement. Those rows already
-- carry reference_id = their own movement id, so the header takes that id and
-- the ledger pointer stays valid without rewriting a single movement.
--
-- supplier_id stays NULL: it was never recorded and cannot be invented.
-- received_date falls back to the day the row was created, and the movement
-- reason is copied verbatim into note rather than being split on the em dash
-- combineNote used, because a note containing one would be corrupted by the
-- guess.
INSERT INTO "stock_receivings" (
    "id", "movement_id", "factory_id", "destination_location_id", "needle_type_id",
    "quantity", "supplier_id", "received_date", "reference_document", "note",
    "created_by", "created_at"
)
SELECT
    m."reference_id", m."id", m."factory_id", m."destination_location_id", m."needle_type_id",
    m."quantity", NULL, (m."created_at" AT TIME ZONE 'UTC')::date, NULL, m."reason",
    m."created_by", m."created_at"
FROM "stock_movements" m
WHERE m."movement_type" = 'RECEIVING'
  AND m."destination_location_id" IS NOT NULL;
