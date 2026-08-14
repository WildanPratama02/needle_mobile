-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'TROLLEY', 'USED_NEEDLE_STORAGE');

-- CreateTable
CREATE TABLE "factories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "timezone" VARCHAR(100) NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "factories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "factory_id" UUID NOT NULL,
    "parent_location_id" UUID,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "location_type" "LocationType" NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trolleys" (
    "id" UUID NOT NULL,
    "factory_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trolleys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "device_code" VARCHAR(100) NOT NULL,
    "device_name" VARCHAR(150) NOT NULL,
    "serial_number" VARCHAR(150) NOT NULL,
    "factory_id" UUID NOT NULL,
    "trolley_id" UUID NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "app_version" VARCHAR(50),
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "employee_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "department" VARCHAR(100),
    "factory_id" UUID NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfid_cards" (
    "id" UUID NOT NULL,
    "rfid_uid" VARCHAR(150) NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rfid_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needle_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100),
    "unit" VARCHAR(20) NOT NULL,
    "minimum_stock" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "needle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_types" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "requires_fragment_validation" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exchange_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_mappings" (
    "id" UUID NOT NULL,
    "trolley_id" UUID NOT NULL,
    "exchange_type_id" UUID NOT NULL,
    "storage_location_id" UUID NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "storage_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balances" (
    "id" UUID NOT NULL,
    "factory_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "needle_type_id" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "reserved_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "factories_code_key" ON "factories"("code");

-- CreateIndex
CREATE INDEX "locations_factory_id_idx" ON "locations"("factory_id");

-- CreateIndex
CREATE INDEX "locations_location_type_idx" ON "locations"("location_type");

-- CreateIndex
CREATE UNIQUE INDEX "locations_factory_id_code_key" ON "locations"("factory_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "trolleys_location_id_key" ON "trolleys"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "trolleys_code_key" ON "trolleys"("code");

-- CreateIndex
CREATE INDEX "trolleys_factory_id_idx" ON "trolleys"("factory_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_code_key" ON "devices"("device_code");

-- CreateIndex
CREATE UNIQUE INDEX "devices_serial_number_key" ON "devices"("serial_number");

-- CreateIndex
CREATE INDEX "devices_factory_id_idx" ON "devices"("factory_id");

-- CreateIndex
CREATE INDEX "devices_trolley_id_idx" ON "devices"("trolley_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE INDEX "employees_factory_id_idx" ON "employees"("factory_id");

-- CreateIndex
CREATE UNIQUE INDEX "rfid_cards_rfid_uid_key" ON "rfid_cards"("rfid_uid");

-- CreateIndex
CREATE INDEX "rfid_cards_employee_id_idx" ON "rfid_cards"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "needle_types_code_key" ON "needle_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_types_code_key" ON "exchange_types"("code");

-- CreateIndex
CREATE INDEX "storage_mappings_storage_location_id_idx" ON "storage_mappings"("storage_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_mappings_trolley_id_exchange_type_id_key" ON "storage_mappings"("trolley_id", "exchange_type_id");

-- CreateIndex
CREATE INDEX "inventory_balances_factory_id_idx" ON "inventory_balances"("factory_id");

-- CreateIndex
CREATE INDEX "inventory_balances_needle_type_id_idx" ON "inventory_balances"("needle_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balances_location_id_needle_type_id_key" ON "inventory_balances"("location_id", "needle_type_id");

-- AddForeignKey
ALTER TABLE "user_factory_scopes" ADD CONSTRAINT "user_factory_scopes_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_location_scopes" ADD CONSTRAINT "user_location_scopes_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_trolley_id_fkey" FOREIGN KEY ("trolley_id") REFERENCES "trolleys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfid_cards" ADD CONSTRAINT "rfid_cards_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_mappings" ADD CONSTRAINT "storage_mappings_trolley_id_fkey" FOREIGN KEY ("trolley_id") REFERENCES "trolleys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_mappings" ADD CONSTRAINT "storage_mappings_exchange_type_id_fkey" FOREIGN KEY ("exchange_type_id") REFERENCES "exchange_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_mappings" ADD CONSTRAINT "storage_mappings_storage_location_id_fkey" FOREIGN KEY ("storage_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_needle_type_id_fkey" FOREIGN KEY ("needle_type_id") REFERENCES "needle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Manually added: Prisma's schema language cannot express CHECK constraints,
-- but Docs/11 §12 and §20 define these as part of the physical schema. Enum
-- columns already cover the doc's status CHECKs.
ALTER TABLE "needle_types"
  ADD CONSTRAINT "needle_types_minimum_stock_non_negative" CHECK ("minimum_stock" >= 0);

ALTER TABLE "inventory_balances"
  ADD CONSTRAINT "inventory_balances_quantity_non_negative" CHECK ("quantity" >= 0),
  ADD CONSTRAINT "inventory_balances_reserved_non_negative" CHECK ("reserved_quantity" >= 0),
  ADD CONSTRAINT "inventory_balances_reserved_within_quantity" CHECK ("reserved_quantity" <= "quantity");
