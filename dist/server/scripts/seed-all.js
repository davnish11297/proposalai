"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../utils/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function main() {
    console.log('🌱 Starting comprehensive database seeding...\n');
    console.log('👤 Step 1: Creating test user and organization...');
    const hashedPassword = await bcrypt_1.default.hash('password123', 12);
    const user = await database_1.prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            password: hashedPassword,
            role: 'ADMIN'
        },
    });
    const organization = await database_1.prisma.organization.upsert({
        where: { id: 'test-org' },
        update: {},
        create: {
            id: 'test-org',
            name: 'Test Organization',
            industry: 'Technology'
        },
    });
    await database_1.prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id }
    });
    console.log('✅ Created test user:', user.email);
    console.log('✅ Created test organization:', organization.name);
    console.log('📝 Login credentials: test@example.com / password123\n');
    console.log('👥 Step 2: Creating sample clients...');
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
    for (const clientData of sampleClients) {
        await database_1.prisma.client.create({
            data: clientData
        });
    }
    console.log('✅ Created 6 sample clients\n');
    console.log('📝 Step 3: Creating sample proposals...');
    const sampleProposals = [
        {
            title: 'Website Redesign Proposal',
            content: `# Website Redesign Proposal

## Executive Summary
We propose a comprehensive website redesign for your company to improve user experience, increase conversions, and modernize your online presence.

## Project Overview
- **Timeline**: 8-12 weeks
- **Budget**: $15,000 - $25,000
- **Team**: 4-6 developers and designers

## Key Features
1. **Responsive Design**: Mobile-first approach
2. **SEO Optimization**: Improved search rankings
3. **Performance**: 50% faster loading times
4. **Analytics**: Advanced tracking and reporting

## Timeline
- Week 1-2: Discovery and planning
- Week 3-6: Design and development
- Week 7-8: Testing and QA
- Week 9-10: Content migration
- Week 11-12: Launch and support

## Investment
Our comprehensive website redesign package includes:
- Custom design and development
- Content management system
- SEO optimization
- Performance optimization
- 3 months of support

**Total Investment: $20,000**`,
            status: 'DRAFT',
            clientName: 'TechCorp Inc.',
            clientEmail: 'contact@techcorp.com',
            estimatedValue: 20000
        },
        {
            title: 'Marketing Automation Platform',
            content: `# Marketing Automation Platform Proposal

## Executive Summary
We propose implementing a comprehensive marketing automation platform to streamline your marketing operations and increase ROI.

## Business Challenge
Your current marketing processes are manual and time-consuming, leading to:
- Inconsistent customer communication
- Missed opportunities for engagement
- Difficulty tracking campaign performance

## Our Solution
A fully integrated marketing automation platform featuring:
- **Email Marketing**: Automated drip campaigns
- **Lead Scoring**: Intelligent lead qualification
- **CRM Integration**: Seamless data flow
- **Analytics Dashboard**: Real-time insights

## Implementation Plan
### Phase 1: Foundation (Weeks 1-4)
- Platform setup and configuration
- Data migration and cleanup
- Team training

### Phase 2: Automation (Weeks 5-8)
- Campaign creation and testing
- Workflow automation
- Integration with existing systems

### Phase 3: Optimization (Weeks 9-12)
- Performance monitoring
- Campaign optimization
- Advanced feature implementation

## ROI Projection
- **Time Savings**: 15-20 hours per week
- **Lead Conversion**: 25% increase
- **Revenue Impact**: $50,000+ annually

## Investment
**Total Project Cost: $35,000**
- Platform licensing: $15,000/year
- Implementation services: $20,000

**Expected ROI: 143% in first year**`,
            status: 'SENT',
            clientName: 'GrowthStart LLC',
            clientEmail: 'hello@growthstart.com',
            estimatedValue: 35000,
            sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'Cloud Migration Strategy',
            content: `# Cloud Migration Strategy Proposal

## Executive Summary
We propose a strategic cloud migration plan to modernize your infrastructure, reduce costs, and improve scalability.

## Current State Assessment
Your on-premise infrastructure presents several challenges:
- High maintenance costs
- Limited scalability
- Security concerns
- Disaster recovery risks

## Migration Strategy
### Phase 1: Assessment & Planning (Month 1)
- Infrastructure audit
- Application compatibility analysis
- Migration roadmap development
- Cost-benefit analysis

### Phase 2: Pilot Migration (Month 2-3)
- Non-critical application migration
- Performance testing
- Security validation
- Team training

### Phase 3: Full Migration (Month 4-6)
- Critical application migration
- Data migration
- Integration testing
- Go-live support

## Expected Benefits
- **Cost Reduction**: 30-40% infrastructure savings
- **Performance**: 50% improvement in application speed
- **Security**: Enterprise-grade security features
- **Scalability**: On-demand resource allocation

## Investment
**Total Migration Cost: $75,000**
- Assessment and planning: $15,000
- Migration services: $45,000
- Training and support: $15,000

**Annual Savings: $60,000**`,
            status: 'DRAFT',
            clientName: 'Enterprise Solutions',
            clientEmail: 'info@enterprisesolutions.com',
            estimatedValue: 75000
        },
        {
            title: 'Mobile App Development',
            content: `# Mobile App Development Proposal

## Executive Summary
We propose developing a custom mobile application to enhance customer engagement and streamline business operations.

## App Concept
A comprehensive mobile solution featuring:
- **Customer Portal**: Account management and support
- **Order Management**: Real-time order tracking
- **Payment Processing**: Secure payment integration
- **Push Notifications**: Personalized alerts

## Technical Specifications
- **Platform**: iOS and Android (React Native)
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Cloud**: AWS infrastructure

## Development Timeline
### Sprint 1-2: Planning & Design (Weeks 1-4)
- Requirements gathering
- UI/UX design
- Technical architecture
- Project setup

### Sprint 3-6: Core Development (Weeks 5-12)
- User authentication
- Core features development
- API development
- Database design

### Sprint 7-8: Testing & Launch (Weeks 13-16)
- Quality assurance
- Performance optimization
- App store submission
- Launch support

## Investment
**Total Development Cost: $45,000**
- Design and planning: $8,000
- Development: $30,000
- Testing and launch: $7,000

**Maintenance**: $2,000/month`,
            status: 'SENT',
            clientName: 'Retail Innovations',
            clientEmail: 'projects@retailinnovations.com',
            estimatedValue: 45000,
            sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
    ];
    for (const proposalData of sampleProposals) {
        await database_1.prisma.proposal.create({
            data: {
                title: proposalData.title,
                content: proposalData.content,
                status: proposalData.status,
                clientName: proposalData.clientName,
                authorId: user.id,
                organizationId: user.organizationId,
                emailRecipient: proposalData.status === 'SENT' ? proposalData.clientEmail : null,
                emailStatus: proposalData.status === 'SENT' ? 'SENT' : null,
                createdAt: proposalData.status === 'SENT'
                    ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                    : new Date()
            }
        });
    }
    console.log('✅ Created 4 sample proposals (2 drafts, 2 sent)\n');
    console.log('📄 Step 4: Creating templates and snippets...');
    const sampleTemplates = [
        {
            name: 'Website Development Proposal',
            description: 'Comprehensive website development proposal template',
            category: 'Web Development',
            content: JSON.stringify({
                sections: [
                    { title: 'Executive Summary', content: 'We propose developing a modern, responsive website that will enhance your online presence and drive business growth.' },
                    { title: 'Project Overview', content: 'Our team will deliver a custom website solution tailored to your specific business needs and goals.' },
                    { title: 'Technical Approach', content: 'We will use modern web technologies including React, Node.js, and cloud hosting for optimal performance.' },
                    { title: 'Timeline', content: 'Project will be completed in 8-12 weeks with regular check-ins and milestone reviews.' },
                    { title: 'Investment', content: 'Total project investment: $15,000 - $25,000 depending on scope and features.' }
                ]
            }),
            isActive: true
        },
        {
            name: 'Mobile App Development',
            description: 'Mobile application development proposal template',
            category: 'Mobile Development',
            content: JSON.stringify({
                sections: [
                    { title: 'Executive Summary', content: 'We propose developing a custom mobile application to enhance customer engagement and streamline operations.' },
                    { title: 'App Concept', content: 'A comprehensive mobile solution featuring user authentication, real-time data, and push notifications.' },
                    { title: 'Technical Stack', content: 'React Native for cross-platform development, Node.js backend, and AWS cloud infrastructure.' },
                    { title: 'Development Phases', content: '4-month development cycle with 2-week sprints and regular client demos.' },
                    { title: 'Investment', content: 'Total development cost: $40,000 - $60,000 with ongoing maintenance options.' }
                ]
            }),
            isActive: true
        },
        {
            name: 'Digital Marketing Campaign',
            description: 'Digital marketing and SEO proposal template',
            category: 'Marketing',
            content: JSON.stringify({
                sections: [
                    { title: 'Executive Summary', content: 'We propose a comprehensive digital marketing strategy to increase your online visibility and drive qualified leads.' },
                    { title: 'Strategy Overview', content: 'Multi-channel approach including SEO, PPC, social media, and content marketing.' },
                    { title: 'Services Included', content: 'Keyword research, content creation, social media management, and performance tracking.' },
                    { title: 'Timeline', content: '3-month initial campaign with ongoing optimization and monthly reporting.' },
                    { title: 'Investment', content: 'Monthly retainer: $3,000 - $5,000 depending on scope and ad spend.' }
                ]
            }),
            isActive: true
        }
    ];
    for (const templateData of sampleTemplates) {
        await database_1.prisma.template.create({ data: templateData });
    }
    const sampleSnippets = [
        {
            title: 'Executive Summary Opening',
            content: 'We are excited to present this comprehensive proposal for [PROJECT_NAME]. Our team has carefully analyzed your requirements and developed a solution that will deliver exceptional results while staying within your budget and timeline.',
            category: 'Executive Summary',
            tags: JSON.stringify(['opening', 'executive-summary', 'introduction'])
        },
        {
            title: 'Problem Statement',
            content: 'Your organization faces several key challenges that impact efficiency and growth: [LIST_CHALLENGES]. These challenges create bottlenecks in your operations and prevent you from achieving your full potential.',
            category: 'Problem Analysis',
            tags: JSON.stringify(['problem', 'challenges', 'pain-points'])
        },
        {
            title: 'Solution Overview',
            content: 'Our proposed solution addresses these challenges through [SOLUTION_APPROACH]. This comprehensive approach will deliver measurable results including [EXPECTED_OUTCOMES].',
            category: 'Solution',
            tags: JSON.stringify(['solution', 'approach', 'benefits'])
        },
        {
            title: 'Timeline Section',
            content: 'Our project timeline is structured to ensure efficient delivery while maintaining quality:\n\n**Phase 1: Discovery & Planning** (Weeks 1-2)\n- Requirements gathering and analysis\n- Technical architecture design\n- Project planning and resource allocation\n\n**Phase 2: Development** (Weeks 3-8)\n- Core development and testing\n- Regular progress updates\n- Client feedback integration\n\n**Phase 3: Launch & Support** (Weeks 9-10)\n- Final testing and quality assurance\n- Deployment and launch\n- Post-launch support and training',
            category: 'Timeline',
            tags: JSON.stringify(['timeline', 'phases', 'schedule'])
        },
        {
            title: 'Investment Summary',
            content: '**Total Project Investment: $[AMOUNT]**\n\nThis investment includes:\n- [SERVICE_1]: $[COST_1]\n- [SERVICE_2]: $[COST_2]\n- [SERVICE_3]: $[COST_3]\n- [SERVICE_4]: $[COST_4]\n\n**Payment Terms:**\n- 50% upfront to begin work\n- 25% at project midpoint\n- 25% upon completion\n\n**ROI Projection:** Expected return on investment within [TIMEFRAME] through [BENEFIT_1] and [BENEFIT_2].',
            category: 'Pricing',
            tags: JSON.stringify(['pricing', 'investment', 'roi', 'payment'])
        },
        {
            title: 'Technical Specifications',
            content: '**Technology Stack:**\n- Frontend: [FRONTEND_TECH]\n- Backend: [BACKEND_TECH]\n- Database: [DATABASE_TECH]\n- Hosting: [HOSTING_PLATFORM]\n- Security: [SECURITY_FEATURES]\n\n**Performance Requirements:**\n- Page load time: < 3 seconds\n- Uptime: 99.9%\n- Mobile responsiveness: 100%\n- SEO optimization: Full compliance',
            category: 'Technical',
            tags: JSON.stringify(['technical', 'specifications', 'requirements'])
        },
        {
            title: 'Next Steps',
            content: 'To move forward with this project, we recommend the following next steps:\n\n1. **Project Kickoff Meeting** - Schedule a detailed discussion to finalize requirements\n2. **Contract Signing** - Review and sign the project agreement\n3. **Resource Allocation** - Assign team members and begin project setup\n4. **Regular Check-ins** - Establish communication schedule and reporting structure\n\nWe\'re excited to partner with you on this project and look forward to delivering exceptional results.',
            category: 'Call to Action',
            tags: JSON.stringify(['next-steps', 'call-to-action', 'closing'])
        }
    ];
    for (const snippetData of sampleSnippets) {
        await database_1.prisma.snippet.create({ data: snippetData });
    }
    console.log('✅ Created 3 templates and 7 snippets\n');
    console.log('🎉 Comprehensive database seeding completed!');
    console.log('📊 Summary:');
    console.log('   - 1 test user (test@example.com / password123)');
    console.log('   - 1 organization');
    console.log('   - 6 clients');
    console.log('   - 4 proposals (2 drafts, 2 sent)');
    console.log('   - 3 templates');
    console.log('   - 7 snippets');
    console.log('\n🚀 You can now login and explore the application with sample data!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    process.exit(0);
});
//# sourceMappingURL=seed-all.js.map