import { PrismaClient, PropertyType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const landlord = await prisma.landlord.upsert({
    where: { email: 'owner@shimahome.local' },
    update: {},
    create: {
      email: 'owner@shimahome.local',
      fullName: 'Primary Landlord',
    },
  });

  const property1 = await prisma.property.create({
    data: {
      title: 'Sunny Bedsitter near CBD',
      type: PropertyType.bedsitter,
      location: 'Nairobi, Kileleshwa',
      rent: 18000,
      reputation: 43 / 10,
      landlordId: landlord.id,
      units: { create: [{ name: 'A-101' }] },
    },
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'Two Bedroom with Security & Parking',
      type: PropertyType.two_bedroom,
      location: 'Nairobi, Westlands',
      rent: 65000,
      reputation: 47 / 10,
      landlordId: landlord.id,
      units: { create: [{ name: 'B-12' }] },
    },
  });

  const property3 = await prisma.property.create({
    data: {
      title: 'Studio – Close to Transit',
      type: PropertyType.studio,
      location: 'Nairobi, South B',
      rent: 25000,
      reputation: 41 / 10,
      landlordId: landlord.id,
      units: { create: [{ name: 'C-7' }] },
    },
  });

  console.log('Seeded:', { landlord, property1: property1.id, property2: property2.id, property3: property3.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
