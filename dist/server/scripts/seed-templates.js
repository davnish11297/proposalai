"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting template and snippet seeding...');
    const sampleTemplates = [
        {
            name: 'Website Development Proposal',
            description: 'Comprehensive website development proposal template',
            category: 'Web Development',
            content: JSON.stringify({
                sections: [
                    {
                        title: 'Executive Summary',
                        content: 'We propose developing a modern, responsive website that will enhance your online presence and drive business growth.'
                    },
                    {
                        title: 'Project Overview',
                        content: 'Our team will deliver a custom website solution tailored to your specific business needs and goals.'
                    },
                    {
                        title: 'Technical Approach',
                        content: 'We will use modern web technologies including React, Node.js, and cloud hosting for optimal performance.'
                    },
                    {
                        title: 'Timeline',
                        content: 'Project will be completed in 8-12 weeks with regular check-ins and milestone reviews.'
                    },
                    {
                        title: 'Investment',
                        content: 'Total project investment: $15,000 - $25,000 depending on scope and features.'
                    }
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
                    {
                        title: 'Executive Summary',
                        content: 'We propose developing a custom mobile application to enhance customer engagement and streamline operations.'
                    },
                    {
                        title: 'App Concept',
                        content: 'A comprehensive mobile solution featuring user authentication, real-time data, and push notifications.'
                    },
                    {
                        title: 'Technical Stack',
                        content: 'React Native for cross-platform development, Node.js backend, and AWS cloud infrastructure.'
                    },
                    {
                        title: 'Development Phases',
                        content: '4-month development cycle with 2-week sprints and regular client demos.'
                    },
                    {
                        title: 'Investment',
                        content: 'Total development cost: $40,000 - $60,000 with ongoing maintenance options.'
                    }
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
                    {
                        title: 'Executive Summary',
                        content: 'We propose a comprehensive digital marketing strategy to increase your online visibility and drive qualified leads.'
                    },
                    {
                        title: 'Strategy Overview',
                        content: 'Multi-channel approach including SEO, PPC, social media, and content marketing.'
                    },
                    {
                        title: 'Services Included',
                        content: 'Keyword research, content creation, social media management, and performance tracking.'
                    },
                    {
                        title: 'Timeline',
                        content: '3-month initial campaign with ongoing optimization and monthly reporting.'
                    },
                    {
                        title: 'Investment',
                        content: 'Monthly retainer: $3,000 - $5,000 depending on scope and ad spend.'
                    }
                ]
            }),
            isActive: true
        }
    ];
    console.log('📄 Creating sample templates...');
    for (const templateData of sampleTemplates) {
        const template = await prisma.template.create({
            data: templateData
        });
        console.log(`✅ Created template: ${template.name} (${template.category})`);
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
    console.log('📝 Creating sample snippets...');
    for (const snippetData of sampleSnippets) {
        const snippet = await prisma.snippet.create({
            data: snippetData
        });
        console.log(`✅ Created snippet: ${snippet.title} (${snippet.category})`);
    }
    console.log('🎉 Template and snippet seeding completed!');
    console.log('📊 Created:');
    console.log('   - 3 templates');
    console.log('   - 7 snippets');
}
main()
    .catch((e) => {
    console.error('❌ Error during template/snippet seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-templates.js.map