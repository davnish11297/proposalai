"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    const hashedPassword = await bcrypt_1.default.hash('password123', 12);
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
    const organization = await prisma.organization.upsert({
        where: { id: 'test-org' },
        update: {},
        create: {
            id: 'test-org',
            name: 'Test Organization',
            description: 'A test organization for development',
            industry: 'Technology'
        },
    });
    console.log('✅ Created test organization:', organization.name);
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
//# sourceMappingURL=seed.js.map