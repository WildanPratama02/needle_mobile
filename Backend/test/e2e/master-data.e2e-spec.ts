import { LocationType, PrismaClient } from '@prisma/client';

import {
  SEED_FACTORY_CODE,
  SEED_LOCATION_CODES,
  SEED_TROLLEY_CODE,
} from '../../src/database/seeds/master-data.seed';

/**
 * Schema-level integration tests. The `master-data` module has no controllers
 * yet (issue 03 is schema + seed only), so these go straight at the database:
 * they prove the CHECK constraints Prisma cannot express really landed, and
 * that the seeded fixture satisfies the cross-row invariants Docs/11 delegates
 * to the backend.
 *
 * Requires `npm run db:seed` to have run against the configured database.
 */
describe('Master data schema (e2e)', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('seeded fixture', () => {
    /**
     * Named rows, not "the first factory and exactly these three types". This
     * asserts what the seed writes; the database is shared and long-lived, so
     * a second trolley created through the product is ordinary use, not a
     * regression, and must not turn this red.
     */
    it('has a factory with warehouse, trolley and used-needle-storage locations', async () => {
      const factory = await prisma.factory.findUniqueOrThrow({
        where: { code: SEED_FACTORY_CODE },
        include: { locations: true },
      });
      const typeByCode = new Map(
        factory.locations.map((location) => [location.code, location.locationType]),
      );

      expect(typeByCode.get(SEED_LOCATION_CODES.warehouse)).toBe(LocationType.WAREHOUSE);
      expect(typeByCode.get(SEED_LOCATION_CODES.trolley)).toBe(LocationType.TROLLEY);
      expect(typeByCode.get(SEED_LOCATION_CODES.usedNeedleStorage)).toBe(
        LocationType.USED_NEEDLE_STORAGE,
      );
    });

    // Docs/11 §8: trolleys.location_id must reference a TROLLEY location.
    it('points every trolley at a TROLLEY-typed location', async () => {
      const trolleys = await prisma.trolley.findMany({ include: { location: true } });

      expect(trolleys.length).toBeGreaterThan(0);
      for (const trolley of trolleys) {
        expect(trolley.location.locationType).toBe(LocationType.TROLLEY);
      }
    });

    // Docs/11 §14: storage_location must be USED_NEEDLE_STORAGE.
    it('points every storage mapping at a USED_NEEDLE_STORAGE location', async () => {
      const mappings = await prisma.storageMapping.findMany({
        include: { storageLocation: true },
      });

      expect(mappings.length).toBeGreaterThan(0);
      for (const mapping of mappings) {
        expect(mapping.storageLocation.locationType).toBe(LocationType.USED_NEEDLE_STORAGE);
      }
    });

    it('marks BROKEN as the only exchange type requiring fragment validation', async () => {
      const types = await prisma.exchangeType.findMany({ orderBy: { code: 'asc' } });

      expect(types.map((type) => type.code)).toEqual(['BENT', 'BROKEN', 'CHANGEOVER']);
      expect(
        types.filter((type) => type.requiresFragmentValidation).map((type) => type.code),
      ).toEqual(['BROKEN']);
    });

    // The seeded trolley specifically: `findFirst` could hand back a trolley
    // created through the product, which has no opening stock and no reason to.
    it('gives the trolley enough opening stock to exercise an issue', async () => {
      const trolley = await prisma.trolley.findUniqueOrThrow({
        where: { code: SEED_TROLLEY_CODE },
      });
      const balances = await prisma.inventoryBalance.findMany({
        where: { locationId: trolley.locationId },
      });

      expect(balances.length).toBeGreaterThan(0);
      for (const balance of balances) {
        expect(balance.quantity.toNumber()).toBeGreaterThan(0);
      }
    });

    // Written by issue 03 so ScopeGuard, which fails closed, can pass at all.
    /**
     * That the admin *reaches* the seeded rows, not that it reaches nothing
     * else. Creating a factory grants its creator scope, so an admin who has
     * used the product legitimately holds more scopes than the seed gave them.
     */
    it('scopes the admin user to the seeded factory and locations', async () => {
      const admin = await prisma.user.findUniqueOrThrow({
        where: { username: process.env.SEED_ADMIN_USERNAME ?? 'admin' },
        include: {
          factoryScopes: { include: { factory: true } },
          locationScopes: { include: { location: true } },
        },
      });

      expect(admin.factoryScopes.map((scope) => scope.factory.code)).toContain(SEED_FACTORY_CODE);
      expect(admin.locationScopes.map((scope) => scope.location.code)).toEqual(
        expect.arrayContaining(Object.values(SEED_LOCATION_CODES)),
      );
    });
  });

  describe('CHECK constraints', () => {
    let factoryId: string;
    let locationId: string;
    let needleTypeId: string;

    beforeAll(async () => {
      const trolley = await prisma.trolley.findFirstOrThrow();
      factoryId = trolley.factoryId;
      locationId = trolley.locationId;
      needleTypeId = (await prisma.needleType.findFirstOrThrow()).id;
    });

    it('rejects a negative needle-type minimum stock', async () => {
      await expect(
        prisma.needleType.create({
          data: {
            code: `TMP-${Date.now()}`,
            name: 'Temp',
            unit: 'PCS',
            minimumStock: -1,
          },
        }),
      ).rejects.toThrow();
    });

    it('rejects a negative inventory quantity', async () => {
      await expect(
        prisma.inventoryBalance.update({
          where: { locationId_needleTypeId: { locationId, needleTypeId } },
          data: { quantity: -1 },
        }),
      ).rejects.toThrow();
    });

    it('rejects reserved quantity above quantity', async () => {
      await expect(
        prisma.inventoryBalance.update({
          where: { locationId_needleTypeId: { locationId, needleTypeId } },
          data: { reservedQuantity: 999999 },
        }),
      ).rejects.toThrow();
    });

    it('rejects a second balance row for the same location and needle type', async () => {
      await expect(
        prisma.inventoryBalance.create({
          data: { factoryId, locationId, needleTypeId, quantity: 1 },
        }),
      ).rejects.toThrow();
    });
  });
});
