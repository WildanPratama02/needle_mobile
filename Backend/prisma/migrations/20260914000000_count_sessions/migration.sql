-- CreateEnum
CREATE TYPE "CountSessionStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateTable
CREATE TABLE "count_sessions" (
    "id" UUID NOT NULL,
    "factory_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "status" "CountSessionStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "count_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "count_session_items" (
    "id" UUID NOT NULL,
    "count_session_id" UUID NOT NULL,
    "needle_type_id" UUID NOT NULL,
    "system_quantity" DECIMAL(18,3) NOT NULL,
    "physical_quantity" DECIMAL(18,3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "count_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "count_sessions_factory_id_created_at_idx" ON "count_sessions"("factory_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "count_session_items_count_session_id_needle_type_id_key" ON "count_session_items"("count_session_id", "needle_type_id");

-- AddForeignKey
ALTER TABLE "count_sessions" ADD CONSTRAINT "count_sessions_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "count_sessions" ADD CONSTRAINT "count_sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "count_sessions" ADD CONSTRAINT "count_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "count_session_items" ADD CONSTRAINT "count_session_items_count_session_id_fkey" FOREIGN KEY ("count_session_id") REFERENCES "count_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "count_session_items" ADD CONSTRAINT "count_session_items_needle_type_id_fkey" FOREIGN KEY ("needle_type_id") REFERENCES "needle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

