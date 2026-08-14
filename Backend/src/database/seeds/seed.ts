// The Nest app gets its env from ConfigModule, but this script runs outside
// Nest and PrismaClient does not read .env on its own — only the Prisma CLI does.
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import { seedIdentity } from './identity.seed';
import { seedMasterData } from './master-data.seed';

/**
 * Development seed entrypoint (`npm run db:seed`).
 *
 * Every step upserts, so re-running against a populated database is safe.
 * Order matters: master data scopes the admin user, so identity goes first.
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const { adminUserId } = await seedIdentity(prisma);
  await seedMasterData(prisma, adminUserId);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
