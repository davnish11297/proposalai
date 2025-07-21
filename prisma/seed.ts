import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed a test user
  const password = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password,
      name: 'Test User',
      role: 'ADMIN',
      isPublicUser: false
    }
  });

  // Create sample proposals
  await prisma.proposal.createMany({
    data: [
      {
        title: 'Website Redesign for Acme Corp',
        description: 'A proposal to redesign the Acme Corp website for better UX and conversion.',
        clientName: 'Acme Corp',
        type: 'PROPOSAL',
        status: 'DRAFT',
        content: 'This is a draft proposal for Acme Corp website redesign.'
      },
      {
        title: 'Mobile App Development for Beta Inc',
        description: 'Proposal for a cross-platform mobile app for Beta Inc.',
        clientName: 'Beta Inc',
        type: 'PROPOSAL',
        status: 'SENT',
        content: 'This is a sent proposal for Beta Inc mobile app.'
      },
      {
        title: 'Cloud Migration for Gamma LLC',
        description: 'Proposal to migrate Gamma LLC infrastructure to the cloud.',
        clientName: 'Gamma LLC',
        type: 'PROPOSAL',
        status: 'DRAFT',
        content: 'This is a draft proposal for Gamma LLC cloud migration.'
      }
    ]
  });

  console.log('✅ Seeded user and proposals!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 