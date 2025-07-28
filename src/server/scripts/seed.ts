import { prisma } from '../utils/database';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      role: 'ADMIN'
    },
  });

  console.log('✅ Created test user:', user.email);
  console.log('📝 Login credentials:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');

  // Create a test organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      valueProps: ['Quality', 'Innovation', 'Reliability']
    },
  });

  console.log('✅ Created test organization:', organization.name);

  // Associate user with organization
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: organization.id }
  });

  console.log('✅ Associated user with organization');
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 