-- DropIndex
DROP INDEX "rfid_cards_rfid_uid_key";

-- CreateIndex
CREATE INDEX "rfid_cards_rfid_uid_idx" ON "rfid_cards"("rfid_uid");

-- Partial unique index: only one ACTIVE row may hold a given rfid_uid at a
-- time. A revoked (INACTIVE) row's rfid_uid is free to be reused by a new
-- row, since a found/reissued physical card must be a fresh enrollment
-- (.scratch/master-data-storage-rfid/spec.md decision #14). Prisma's schema
-- DSL cannot express a partial unique index, so it is hand-written here and
-- not represented in schema.prisma beyond the plain (non-unique) index above.
CREATE UNIQUE INDEX "rfid_cards_rfid_uid_active_key" ON "rfid_cards"("rfid_uid") WHERE "status" = 'ACTIVE';
