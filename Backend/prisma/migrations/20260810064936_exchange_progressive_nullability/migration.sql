-- DropForeignKey
ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_exchange_type_id_fkey";

-- DropForeignKey
ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_old_needle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_operator_id_fkey";

-- AlterTable
ALTER TABLE "exchanges" ALTER COLUMN "operator_id" DROP NOT NULL,
ALTER COLUMN "old_needle_type_id" DROP NOT NULL,
ALTER COLUMN "exchange_type_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_old_needle_type_id_fkey" FOREIGN KEY ("old_needle_type_id") REFERENCES "needle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_exchange_type_id_fkey" FOREIGN KEY ("exchange_type_id") REFERENCES "exchange_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
