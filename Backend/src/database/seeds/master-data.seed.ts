import { LocationType, PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

import { ROLES } from '../../shared/constants/roles';

/**
 * Minimum viable factory floor: enough master data to drive one exchange from
 * `CREATED` to `COMPLETED` in development and e2e tests.
 *
 * The ticket asked for "1 location", but the flow genuinely needs three — a
 * warehouse to issue new needles from, the trolley's own location (ADR-003:
 * a trolley *is* an inventory location), and a used-needle storage bay for
 * `storage_mappings` to point at. Seeding one would leave the exchange flow
 * unexercisable.
 */

const FACTORY_CODE = 'FAC-A';
const TROLLEY_CODE = 'A-01';

export interface MasterDataSeedResult {
  factoryId: string;
  locationIds: string[];
}

/**
 * A factory-scoped APPROVER.
 *
 * Not cosmetic: `/exchanges/{id}/fragment` with NOT_FOUND resolves its
 * recipient by role APPROVER plus factory scope (round 4 Q11) and returns 409
 * when none exists, so without this row a BROKEN exchange with a missing
 * fragment cannot be raised at all on a fresh database.
 */
async function seedApprover(prisma: PrismaClient, factoryId: string): Promise<void> {
  const username = process.env.SEED_APPROVER_USERNAME ?? 'approver';
  const password = process.env.SEED_APPROVER_PASSWORD ?? 'ChangeMe123!';

  const role = await prisma.role.findUniqueOrThrow({ where: { code: ROLES.APPROVER } });

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      name: 'Factory A Approver',
      email: `${username}@needle.local`,
      // WhatsApp destination for confirmation notices (issue 08). A dev
      // placeholder — real numbers come from user administration.
      phoneNumber: process.env.SEED_APPROVER_PHONE ?? '+620000000001',
      passwordHash: await hash(password, 10),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  await prisma.userFactoryScope.upsert({
    where: { userId_factoryId: { userId: user.id, factoryId } },
    update: {},
    create: { userId: user.id, factoryId },
  });

  console.log(`Seeded approver user "${username}" scoped to the seeded factory`);
}

export async function seedMasterData(
  prisma: PrismaClient,
  adminUserId: string,
): Promise<MasterDataSeedResult> {
  const factory = await prisma.factory.upsert({
    where: { code: FACTORY_CODE },
    update: {},
    create: {
      code: FACTORY_CODE,
      name: 'Factory A',
      description: 'Development factory',
      timezone: 'Asia/Jakarta',
    },
  });

  const warehouse = await prisma.location.upsert({
    where: { factoryId_code: { factoryId: factory.id, code: 'WH-01' } },
    update: {},
    create: {
      factoryId: factory.id,
      code: 'WH-01',
      name: 'Main Warehouse',
      locationType: LocationType.WAREHOUSE,
    },
  });

  // Trolley and storage bay hang off the warehouse in the location hierarchy.
  const trolleyLocation = await prisma.location.upsert({
    where: { factoryId_code: { factoryId: factory.id, code: `TRL-${TROLLEY_CODE}` } },
    update: {},
    create: {
      factoryId: factory.id,
      parentLocationId: warehouse.id,
      code: `TRL-${TROLLEY_CODE}`,
      name: `Trolley ${TROLLEY_CODE}`,
      locationType: LocationType.TROLLEY,
    },
  });

  const usedNeedleStorage = await prisma.location.upsert({
    where: { factoryId_code: { factoryId: factory.id, code: 'UNS-01' } },
    update: {},
    create: {
      factoryId: factory.id,
      parentLocationId: warehouse.id,
      code: 'UNS-01',
      name: 'Used Needle Storage',
      locationType: LocationType.USED_NEEDLE_STORAGE,
    },
  });

  const trolley = await prisma.trolley.upsert({
    where: { code: TROLLEY_CODE },
    update: {},
    create: {
      factoryId: factory.id,
      locationId: trolleyLocation.id,
      code: TROLLEY_CODE,
      name: `Trolley ${TROLLEY_CODE}`,
    },
  });

  await prisma.device.upsert({
    where: { deviceCode: 'NM-TAB-001' },
    update: {},
    create: {
      deviceCode: 'NM-TAB-001',
      deviceName: 'Trolley A-01 Tablet',
      serialNumber: 'SN-NM-TAB-001',
      factoryId: factory.id,
      trolleyId: trolley.id,
      appVersion: '1.0.0',
    },
  });

  const employee = await prisma.employee.upsert({
    where: { employeeNumber: 'EMP-0001' },
    update: {},
    create: {
      employeeNumber: 'EMP-0001',
      name: 'Siti Operator',
      department: 'Sewing Line 1',
      factoryId: factory.id,
    },
  });

  await prisma.rfidCard.upsert({
    where: { rfidUid: 'RFID-0001' },
    update: {},
    create: { rfidUid: 'RFID-0001', employeeId: employee.id },
  });

  const needleTypes = await Promise.all(
    [
      { code: 'DBX1-11', name: 'DBx1 #11', category: 'Sewing', unit: 'PCS', minimumStock: 50 },
      { code: 'DBX1-14', name: 'DBx1 #14', category: 'Sewing', unit: 'PCS', minimumStock: 50 },
    ].map((needle) =>
      prisma.needleType.upsert({ where: { code: needle.code }, update: {}, create: needle }),
    ),
  );

  // requiresFragmentValidation is what makes FRAGMENT_CHECK apply to BROKEN
  // only (CONTEXT.md) — BENT and CHANGEOVER skip that step entirely.
  const exchangeTypes = await Promise.all(
    [
      { code: 'BROKEN', name: 'Broken needle', requiresFragmentValidation: true },
      { code: 'BENT', name: 'Bent needle', requiresFragmentValidation: false },
      { code: 'CHANGEOVER', name: 'Changeover', requiresFragmentValidation: false },
    ].map((type) =>
      prisma.exchangeType.upsert({ where: { code: type.code }, update: {}, create: type }),
    ),
  );

  // Every exchange type on this trolley stores its used needle in the same bay.
  for (const exchangeType of exchangeTypes) {
    await prisma.storageMapping.upsert({
      where: {
        trolleyId_exchangeTypeId: { trolleyId: trolley.id, exchangeTypeId: exchangeType.id },
      },
      update: {},
      create: {
        trolleyId: trolley.id,
        exchangeTypeId: exchangeType.id,
        storageLocationId: usedNeedleStorage.id,
      },
    });
  }

  // Opening stock: a deep warehouse balance, a smaller trolley balance that
  // issue 05's stock check at NEEDLE_ISSUED can actually exhaust.
  for (const needleType of needleTypes) {
    for (const [location, quantity] of [
      [warehouse, 500],
      [trolleyLocation, 20],
    ] as const) {
      // Reset to the opening quantity rather than leaving whatever is there.
      // These are declared opening balances for development: exchanges and
      // e2e runs draw stock down, and without a reset the trolley eventually
      // empties and the issue path stops being exercisable. Still idempotent —
      // repeated runs converge on the same numbers.
      await prisma.inventoryBalance.upsert({
        where: {
          locationId_needleTypeId: { locationId: location.id, needleTypeId: needleType.id },
        },
        update: { quantity },
        create: {
          factoryId: factory.id,
          locationId: location.id,
          needleTypeId: needleType.id,
          quantity,
        },
      });
    }
  }

  const locationIds = [warehouse.id, trolleyLocation.id, usedNeedleStorage.id];

  await seedApprover(prisma, factory.id);

  // Now that factories and locations exist, the admin can finally be scoped —
  // ScopeGuard fails closed, so without these rows every scoped route refuses.
  await prisma.userFactoryScope.upsert({
    where: { userId_factoryId: { userId: adminUserId, factoryId: factory.id } },
    update: {},
    create: { userId: adminUserId, factoryId: factory.id },
  });

  for (const locationId of locationIds) {
    await prisma.userLocationScope.upsert({
      where: { userId_locationId: { userId: adminUserId, locationId } },
      update: {},
      create: { userId: adminUserId, locationId },
    });
  }

  console.log(
    `Seeded master data: 1 factory, ${locationIds.length} locations, 1 trolley, 1 device, ` +
      `1 employee + RFID card, ${needleTypes.length} needle types, ${exchangeTypes.length} exchange types, ` +
      `${exchangeTypes.length} storage mappings, ${needleTypes.length * 2} inventory balances`,
  );
  console.log('Scoped the admin user to the seeded factory and locations');

  return { factoryId: factory.id, locationIds };
}
