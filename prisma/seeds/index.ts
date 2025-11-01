import { PrismaClient } from '../generated/client';

const providers = [
  {
    name: 'Orange Money',
    code: 'om',
  },
  {
    name: 'Wave',
    code: 'wave',
  },
];

const prisma = new PrismaClient();

async function seedProviders() {
  for (const provider of providers) {
    const data = {
      code: provider.code,
      name: provider.name,
    };

    await prisma.channel.upsert({
      where: { code: provider.code },
      update: data,
      create: data,
    });
  }

  console.log('✅ Providers seeded');
}

async function main() {
  await seedProviders();
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
