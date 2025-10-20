import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Add seed data here during development
  // Example:
  // const user = await prisma.user.create({
  //   data: {
  //     email: 'test@example.com',
  //     googleId: 'test-google-id',
  //     name: 'Test User',
  //   },
  // });

  console.log('✅ Seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
