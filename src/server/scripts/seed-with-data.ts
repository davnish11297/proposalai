import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'ADMIN'
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create a test organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      valueProps: ['Quality', 'Innovation', 'Reliability', 'Customer Focus']
    },
  });

  console.log('✅ Created test organization:', organization.name);

  // Associate user with organization
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: organization.id }
  });

  console.log('✅ Associated user with organization');

  // Create test clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'John Smith',
        email: 'john.smith@acmecorp.com',
        phone: '+1-555-0123',
        company: 'Acme Corporation',
        industry: 'Technology',
        notes: 'Interested in web development services',
        organizationId: organization.id
      }
    }),
    prisma.client.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@innovateco.com',
        phone: '+1-555-0456',
        company: 'InnovateCo',
        industry: 'Healthcare',
        notes: 'Looking for mobile app development',
        organizationId: organization.id
      }
    }),
    prisma.client.create({
      data: {
        name: 'Mike Chen',
        email: 'mike.chen@startupxyz.com',
        phone: '+1-555-0789',
        company: 'StartupXYZ',
        industry: 'E-commerce',
        notes: 'Need e-commerce platform development',
        organizationId: organization.id
      }
    })
  ]);

  console.log('✅ Created test clients:', clients.map(c => c.name).join(', '));

  // Create test drafts
  const drafts = await Promise.all([
    prisma.proposal.create({
      data: {
        title: 'Web Development Project for Acme Corp',
        description: 'Comprehensive web development services including frontend, backend, and database design',
        type: 'Web Development',
        status: 'DRAFT',
        content: JSON.stringify({
          executiveSummary: 'We propose to develop a modern, responsive web application for Acme Corporation that will streamline their business processes and improve customer engagement.',
          approach: 'Our development approach includes:\n• Agile methodology with 2-week sprints\n• Modern tech stack (React, Node.js, MongoDB)\n• Comprehensive testing and quality assurance\n• Regular client feedback sessions',
          budgetDetails: 'Total Project Cost: $25,000\n• Frontend Development: $10,000\n• Backend Development: $8,000\n• Database Design: $3,000\n• Testing & QA: $2,000\n• Project Management: $2,000',
          timeline: 'Project Timeline: 12 weeks\n• Week 1-2: Planning and Design\n• Week 3-6: Frontend Development\n• Week 7-10: Backend Development\n• Week 11-12: Testing and Deployment'
        }),
        author: { connect: { id: user.id } },
        organization: { connect: { id: organization.id } },
        client: { connect: { id: clients[0].id } }
      }
    }),
    prisma.proposal.create({
      data: {
        title: 'Mobile App Development for Healthcare Platform',
        description: 'Cross-platform mobile application for healthcare management and patient engagement',
        type: 'Mobile Development',
        status: 'DRAFT',
        content: JSON.stringify({
          executiveSummary: 'We propose to develop a comprehensive mobile application for InnovateCo\'s healthcare platform that will enhance patient care and streamline medical workflows.',
          approach: 'Our development approach includes:\n• Cross-platform development using React Native\n• HIPAA-compliant security measures\n• Integration with existing healthcare systems\n• User experience optimization for medical professionals',
          budgetDetails: 'Total Project Cost: $35,000\n• Mobile App Development: $20,000\n• Backend API Development: $8,000\n• Security Implementation: $4,000\n• Testing & Compliance: $3,000',
          timeline: 'Project Timeline: 16 weeks\n• Week 1-3: Requirements and Design\n• Week 4-10: Mobile App Development\n• Week 11-13: Backend Development\n• Week 14-16: Testing and Deployment'
        }),
        author: { connect: { id: user.id } },
        organization: { connect: { id: organization.id } },
        client: { connect: { id: clients[1].id } }
      }
    }),
    prisma.proposal.create({
      data: {
        title: 'E-commerce Platform Development',
        description: 'Full-featured e-commerce platform with payment processing and inventory management',
        type: 'E-commerce',
        status: 'DRAFT',
        content: JSON.stringify({
          executiveSummary: 'We propose to develop a comprehensive e-commerce platform for StartupXYZ that will enable them to sell products online with advanced features and analytics.',
          approach: 'Our development approach includes:\n• Modern e-commerce architecture\n• Payment gateway integration (Stripe, PayPal)\n• Inventory and order management system\n• Customer analytics and reporting',
          budgetDetails: 'Total Project Cost: $40,000\n• E-commerce Platform: $25,000\n• Payment Integration: $8,000\n• Inventory Management: $4,000\n• Analytics & Reporting: $3,000',
          timeline: 'Project Timeline: 18 weeks\n• Week 1-4: Planning and Architecture\n• Week 5-12: Platform Development\n• Week 13-16: Payment Integration\n• Week 17-18: Testing and Launch'
        }),
        author: { connect: { id: user.id } },
        organization: { connect: { id: organization.id } },
        client: { connect: { id: clients[2].id } }
      }
    })
  ]);

  console.log('✅ Created test drafts:', drafts.map(d => d.title).join(', '));

  // Create test sent proposals
  const sentProposals = await Promise.all([
    prisma.proposal.create({
      data: {
        title: 'Digital Marketing Strategy Proposal',
        description: 'Comprehensive digital marketing strategy including SEO, PPC, and social media management',
        type: 'Digital Marketing',
        status: 'SENT',
        content: JSON.stringify({
          executiveSummary: 'We propose a comprehensive digital marketing strategy that will increase your online presence and drive qualified leads to your business.',
          approach: 'Our marketing approach includes:\n• Search Engine Optimization (SEO)\n• Pay-Per-Click (PPC) Advertising\n• Social Media Management\n• Content Marketing Strategy',
          budgetDetails: 'Monthly Investment: $5,000\n• SEO Services: $2,000\n• PPC Management: $1,500\n• Social Media: $1,000\n• Content Creation: $500',
          timeline: 'Implementation Timeline: 3 months\n• Month 1: Strategy Development and Setup\n• Month 2: Campaign Launch and Optimization\n• Month 3: Performance Analysis and Scaling'
        }),
        author: { connect: { id: user.id } },
        organization: { connect: { id: organization.id } },
        client: { connect: { id: clients[0].id } },
        clientName: 'John Smith',
        metadata: JSON.stringify({
          accessCodes: ['ABC123'],
          lastEmailSent: {
            accessCode: 'ABC123',
            trackingId: 'track-123456',
            sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
      }
    }),
    prisma.proposal.create({
      data: {
        title: 'Cloud Infrastructure Migration Proposal',
        description: 'Migration of on-premise infrastructure to cloud-based solutions for improved scalability and cost efficiency',
        type: 'Cloud Services',
        status: 'SENT',
        content: JSON.stringify({
          executiveSummary: 'We propose to migrate your current on-premise infrastructure to a cloud-based solution that will improve scalability, reduce costs, and enhance security.',
          approach: 'Our migration approach includes:\n• Infrastructure Assessment and Planning\n• Cloud Architecture Design\n• Data Migration Strategy\n• Security and Compliance Implementation',
          budgetDetails: 'Total Migration Cost: $50,000\n• Assessment and Planning: $10,000\n• Cloud Architecture: $15,000\n• Data Migration: $20,000\n• Testing and Validation: $5,000',
          timeline: 'Migration Timeline: 8 weeks\n• Week 1-2: Assessment and Planning\n• Week 3-4: Architecture Design\n• Week 5-6: Data Migration\n• Week 7-8: Testing and Go-Live'
        }),
        author: { connect: { id: user.id } },
        organization: { connect: { id: organization.id } },
        client: { connect: { id: clients[1].id } },
        clientName: 'Sarah Johnson',
        metadata: JSON.stringify({
          accessCodes: ['DEF456'],
          lastEmailSent: {
            accessCode: 'DEF456',
            trackingId: 'track-789012',
            sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
      }
    })
  ]);

  console.log('✅ Created test sent proposals:', sentProposals.map(p => p.title).join(', '));

  // Create some activities for the proposals
  await Promise.all([
    prisma.activity.create({
      data: {
        type: 'PROPOSAL_CREATED',
        message: 'Created new proposal: Web Development Project for Acme Corp',
        details: 'Draft proposal created for web development services',
        user: { connect: { id: user.id } },
        proposal: { connect: { id: drafts[0].id } }
      }
    }),
    prisma.activity.create({
      data: {
        type: 'PROPOSAL_SENT',
        message: 'Sent proposal: Digital Marketing Strategy Proposal',
        details: 'Proposal sent to john.smith@acmecorp.com',
        user: { connect: { id: user.id } },
        proposal: { connect: { id: sentProposals[0].id } }
      }
    }),
    prisma.activity.create({
      data: {
        type: 'PROPOSAL_SENT',
        message: 'Sent proposal: Cloud Infrastructure Migration Proposal',
        details: 'Proposal sent to sarah.johnson@innovateco.com',
        user: { connect: { id: user.id } },
        proposal: { connect: { id: sentProposals[1].id } }
      }
    })
  ]);

  console.log('✅ Created test activities');

  console.log('\n📝 Login credentials:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');
  
  console.log('\n📊 Test Data Created:');
  console.log('   • 1 User account');
  console.log('   • 1 Organization');
  console.log('   • 3 Clients');
  console.log('   • 3 Draft proposals');
  console.log('   • 2 Sent proposals');
  console.log('   • 3 Activity records');
  
  console.log('\n🎉 Comprehensive database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 