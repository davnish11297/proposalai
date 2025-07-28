"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../utils/database");
async function main() {
    console.log('🌱 Starting proposal seeding...');
    const user = await database_1.prisma.user.findUnique({
        where: { email: 'test@example.com' },
        include: { organization: true }
    });
    if (!user) {
        console.error('❌ Test user not found. Please run the main seed script first.');
        return;
    }
    console.log('✅ Found test user:', user.email);
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
            estimatedValue: 20000,
            organizationId: user.organizationId
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
            organizationId: user.organizationId,
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
            estimatedValue: 75000,
            organizationId: user.organizationId
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
            organizationId: user.organizationId,
            sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
    ];
    console.log('📝 Creating sample proposals...');
    for (const proposalData of sampleProposals) {
        const proposal = await database_1.prisma.proposal.create({
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
        console.log(`✅ Created ${proposal.status} proposal: ${proposal.title}`);
    }
    console.log('🎉 Proposal seeding completed!');
    console.log('📊 Created:');
    console.log('   - 2 Draft proposals');
    console.log('   - 2 Sent proposals');
    console.log('   - Total value: $175,000');
}
main()
    .catch((e) => {
    console.error('❌ Error during proposal seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    process.exit(0);
});
//# sourceMappingURL=seed-proposals.js.map