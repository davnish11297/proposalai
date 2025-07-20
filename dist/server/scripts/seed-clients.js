"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting client seeding...');
    const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
        include: { organization: true }
    });
    if (!user || !user.organizationId) {
        console.error('❌ Test user or organization not found. Please run the main seed script first.');
        return;
    }
    console.log('✅ Found test organization:', user.organization?.name);
    const sampleClients = [
        {
            name: 'TechCorp Inc.',
            email: 'contact@techcorp.com',
            phone: '+1 (555) 123-4567',
            company: 'TechCorp Inc.',
            industry: 'Technology',
            notes: 'Looking for website redesign and digital transformation services.'
        },
        {
            name: 'GrowthStart LLC',
            email: 'hello@growthstart.com',
            phone: '+1 (555) 234-5678',
            company: 'GrowthStart LLC',
            industry: 'SaaS',
            notes: 'Startup focused on marketing automation and lead generation.'
        },
        {
            name: 'Enterprise Solutions',
            email: 'info@enterprisesolutions.com',
            phone: '+1 (555) 345-6789',
            company: 'Enterprise Solutions',
            industry: 'Enterprise Software',
            notes: 'Large enterprise looking to migrate to cloud infrastructure.'
        },
        {
            name: 'Retail Innovations',
            email: 'projects@retailinnovations.com',
            phone: '+1 (555) 456-7890',
            company: 'Retail Innovations',
            industry: 'Retail',
            notes: 'Retail chain seeking mobile app development for customer engagement.'
        },
        {
            name: 'Healthcare Plus',
            email: 'contact@healthcareplus.com',
            phone: '+1 (555) 567-8901',
            company: 'Healthcare Plus',
            industry: 'Healthcare',
            notes: 'Healthcare provider looking for patient management system.'
        },
        {
            name: 'Finance First',
            email: 'hello@financefirst.com',
            phone: '+1 (555) 678-9012',
            company: 'Finance First',
            industry: 'Financial Services',
            notes: 'Financial services company seeking secure payment processing solution.'
        }
    ];
    console.log('👥 Creating sample clients...');
    for (const clientData of sampleClients) {
        const client = await prisma.client.create({
            data: clientData
        });
        console.log(`✅ Created client: ${client.name} (${client.company})`);
    }
    console.log('🎉 Client seeding completed!');
    console.log('📊 Created 6 sample clients');
}
main()
    .catch((e) => {
    console.error('❌ Error during client seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-clients.js.map