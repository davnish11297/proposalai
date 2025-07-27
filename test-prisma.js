// Test Prisma setup
const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  console.log('🧪 Testing Prisma setup...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Prisma connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log('✅ User count query successful:', userCount);
    
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected successfully');
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    process.exit(1);
  }
}

testPrisma(); 