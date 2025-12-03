import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Get test database client
 * Uses DATABASE_URL_TEST if available, otherwise uses DATABASE_URL
 */
export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL or DATABASE_URL_TEST must be set for tests');
    }
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  return prisma;
}

/**
 * Reset test database (truncate all tables)
 * WARNING: Only use in test environment
 */
export async function resetTestDatabase(): Promise<void> {
  const testPrisma = getTestPrisma();
  
  // Delete in order to respect foreign key constraints
  await testPrisma.osmNode.deleteMany();
  await testPrisma.submission.deleteMany();
  await testPrisma.emailVerification.deleteMany();
  await testPrisma.adminUser.deleteMany();
  await testPrisma.geocodingCache.deleteMany();
  await testPrisma.geocodingRateLimit.deleteMany();
  await testPrisma.newsletterSubscription.deleteMany();
  await testPrisma.testimonial.deleteMany();
}

/**
 * Seed test data
 */
export async function seedTestData(data: {
  submissions?: any[];
  osmNodes?: any[];
  adminUsers?: any[];
}): Promise<void> {
  const testPrisma = getTestPrisma();
  
  if (data.submissions) {
    for (const submission of data.submissions) {
      await testPrisma.submission.create({ data: submission });
    }
  }
  
  if (data.osmNodes) {
    for (const node of data.osmNodes) {
      await testPrisma.osmNode.create({ data: node });
    }
  }
  
  if (data.adminUsers) {
    for (const user of data.adminUsers) {
      await testPrisma.adminUser.create({ data: user });
    }
  }
}

/**
 * Close test database connection
 */
export async function closeTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

