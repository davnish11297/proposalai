"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../utils/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedData = async () => {
    console.log('🌱 Starting database seeding...');
    try {
        console.log('📋 Creating test organization...');
        const organization = await database_1.prisma.organization.create({
            data: {
                name: 'ProposalAI Demo',
                slug: 'proposalai-demo',
                description: 'A demo organization for testing ProposalAI features',
                website: 'https://proposalai.com',
                industry: 'Technology',
                size: '10-50',
                primaryColor: '#f97316',
                secondaryColor: '#1f2937',
                fontFamily: 'Inter',
                brandVoice: 'Professional, innovative, and trustworthy',
                brandGuidelines: 'Focus on clarity and professionalism',
                valueProps: ['AI-powered', 'Time-saving', 'Professional results'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log('👤 Creating test user...');
        const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
        const user = await database_1.prisma.user.create({
            data: {
                email: 'demo@proposalai.com',
                firstName: 'Demo',
                lastName: 'User',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
                emailVerified: true,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log('👥 Creating test clients...');
        const clients = [
            {
                name: 'TechCorp Solutions',
                email: 'contact@techcorp.com',
                phone: '+1-555-0123',
                company: 'TechCorp Solutions',
                industry: 'Technology',
                website: 'https://techcorp.com',
                address: '123 Tech Street, San Francisco, CA 94105',
                notes: 'Looking for web development services',
                status: 'ACTIVE',
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Green Energy Co',
                email: 'info@greenenergy.com',
                phone: '+1-555-0456',
                company: 'Green Energy Co',
                industry: 'Energy',
                website: 'https://greenenergy.com',
                address: '456 Green Ave, Austin, TX 73301',
                notes: 'Interested in renewable energy consulting',
                status: 'ACTIVE',
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'HealthFirst Medical',
                email: 'admin@healthfirst.com',
                phone: '+1-555-0789',
                company: 'HealthFirst Medical',
                industry: 'Healthcare',
                website: 'https://healthfirst.com',
                address: '789 Health Blvd, Boston, MA 02108',
                notes: 'Need medical software development',
                status: 'ACTIVE',
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'EduTech Innovations',
                email: 'hello@edutech.com',
                phone: '+1-555-0321',
                company: 'EduTech Innovations',
                industry: 'Education',
                website: 'https://edutech.com',
                address: '321 Education Way, Seattle, WA 98101',
                notes: 'Educational platform development',
                status: 'ACTIVE',
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Retail Solutions Inc',
                email: 'sales@retailsolutions.com',
                phone: '+1-555-0654',
                company: 'Retail Solutions Inc',
                industry: 'Retail',
                website: 'https://retailsolutions.com',
                address: '654 Retail Road, New York, NY 10001',
                notes: 'E-commerce platform enhancement',
                status: 'ACTIVE',
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        const createdClients = [];
        for (const clientData of clients) {
            const client = await database_1.prisma.client.create({
                data: clientData
            });
            createdClients.push(client);
        }
        console.log('📄 Creating test templates...');
        const templates = [
            {
                name: 'Web Development Proposal',
                description: 'Standard template for web development projects',
                category: 'Technology',
                content: {
                    sections: [
                        {
                            title: 'Executive Summary',
                            content: 'We will deliver a modern, responsive web application that meets your business requirements.'
                        },
                        {
                            title: 'Project Scope',
                            content: 'Full-stack web development including frontend, backend, and database design.'
                        },
                        {
                            title: 'Timeline',
                            content: '8-12 weeks depending on complexity and requirements.'
                        },
                        {
                            title: 'Budget',
                            content: 'Starting from $15,000 for basic projects, custom pricing for complex requirements.'
                        }
                    ]
                },
                isActive: true,
                isPublic: true,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Consulting Services Proposal',
                description: 'Template for business consulting and advisory services',
                category: 'Consulting',
                content: {
                    sections: [
                        {
                            title: 'Executive Summary',
                            content: 'Strategic consulting services to optimize your business operations and drive growth.'
                        },
                        {
                            title: 'Our Approach',
                            content: 'Comprehensive analysis, strategic planning, and implementation support.'
                        },
                        {
                            title: 'Deliverables',
                            content: 'Detailed reports, strategic recommendations, and ongoing support.'
                        },
                        {
                            title: 'Investment',
                            content: 'Project-based pricing starting from $5,000 per engagement.'
                        }
                    ]
                },
                isActive: true,
                isPublic: true,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Marketing Campaign Proposal',
                description: 'Template for digital marketing and advertising campaigns',
                category: 'Marketing',
                content: {
                    sections: [
                        {
                            title: 'Campaign Overview',
                            content: 'Comprehensive digital marketing campaign to increase brand awareness and drive conversions.'
                        },
                        {
                            title: 'Strategy',
                            content: 'Multi-channel approach including social media, PPC, and content marketing.'
                        },
                        {
                            title: 'Timeline',
                            content: '3-6 month campaign with monthly reporting and optimization.'
                        },
                        {
                            title: 'Budget',
                            content: 'Monthly retainer starting from $3,000 plus ad spend.'
                        }
                    ]
                },
                isActive: true,
                isPublic: true,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        const createdTemplates = [];
        for (const templateData of templates) {
            const template = await database_1.prisma.template.create({
                data: templateData
            });
            createdTemplates.push(template);
        }
        console.log('📝 Creating test proposals...');
        const proposals = [
            {
                title: 'E-commerce Platform Development',
                description: 'Modern e-commerce platform for TechCorp Solutions',
                clientName: 'TechCorp Solutions',
                clientEmail: 'contact@techcorp.com',
                status: 'SENT',
                type: 'PROPOSAL',
                content: {
                    executiveSummary: 'We will develop a modern, scalable e-commerce platform that will increase your online sales by 40% within 6 months.',
                    approach: 'Agile development methodology with weekly sprints and regular client feedback sessions.',
                    budgetDetails: 'Total project cost: $25,000\n- Frontend Development: $8,000\n- Backend Development: $10,000\n- Database Design: $3,000\n- Testing & QA: $2,000\n- Project Management: $2,000',
                    timeline: '12 weeks total\n- Weeks 1-4: Planning and Design\n- Weeks 5-8: Development\n- Weeks 9-10: Testing\n- Weeks 11-12: Deployment and Training'
                },
                metadata: {
                    estimatedValue: 25000,
                    probability: 0.8,
                    tags: ['e-commerce', 'web-development', 'high-value']
                },
                isPublic: false,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Renewable Energy Consulting',
                description: 'Strategic consulting for Green Energy Co',
                clientName: 'Green Energy Co',
                clientEmail: 'info@greenenergy.com',
                status: 'DRAFT',
                type: 'PROPOSAL',
                content: {
                    executiveSummary: 'Comprehensive renewable energy strategy to reduce costs and environmental impact.',
                    approach: 'Detailed energy audit followed by strategic recommendations and implementation support.',
                    budgetDetails: 'Consulting fee: $15,000\n- Energy Audit: $5,000\n- Strategy Development: $7,000\n- Implementation Support: $3,000',
                    timeline: '8 weeks\n- Weeks 1-2: Energy Audit\n- Weeks 3-4: Analysis\n- Weeks 5-6: Strategy Development\n- Weeks 7-8: Presentation and Planning'
                },
                metadata: {
                    estimatedValue: 15000,
                    probability: 0.6,
                    tags: ['consulting', 'energy', 'sustainability']
                },
                isPublic: false,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Medical Software Development',
                description: 'Healthcare management system for HealthFirst Medical',
                clientName: 'HealthFirst Medical',
                clientEmail: 'admin@healthfirst.com',
                status: 'SENT',
                type: 'PROPOSAL',
                content: {
                    executiveSummary: 'Custom healthcare management system to streamline patient care and administrative processes.',
                    approach: 'HIPAA-compliant development with focus on security and user experience.',
                    budgetDetails: 'Total project cost: $45,000\n- Requirements Analysis: $5,000\n- System Design: $8,000\n- Development: $20,000\n- Testing & Compliance: $8,000\n- Training & Support: $4,000',
                    timeline: '16 weeks\n- Weeks 1-4: Requirements and Design\n- Weeks 5-12: Development\n- Weeks 13-14: Testing\n- Weeks 15-16: Deployment and Training'
                },
                metadata: {
                    estimatedValue: 45000,
                    probability: 0.9,
                    tags: ['healthcare', 'software', 'high-value', 'compliance']
                },
                isPublic: false,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                publishedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Educational Platform Development',
                description: 'Online learning platform for EduTech Innovations',
                clientName: 'EduTech Innovations',
                clientEmail: 'hello@edutech.com',
                status: 'DRAFT',
                type: 'PROPOSAL',
                content: {
                    executiveSummary: 'Interactive online learning platform to enhance student engagement and learning outcomes.',
                    approach: 'User-centered design with gamification elements and analytics dashboard.',
                    budgetDetails: 'Total project cost: $35,000\n- UX/UI Design: $6,000\n- Frontend Development: $12,000\n- Backend Development: $10,000\n- Analytics Integration: $4,000\n- Testing & Deployment: $3,000',
                    timeline: '14 weeks\n- Weeks 1-3: Design and Planning\n- Weeks 4-10: Development\n- Weeks 11-12: Testing\n- Weeks 13-14: Deployment'
                },
                metadata: {
                    estimatedValue: 35000,
                    probability: 0.7,
                    tags: ['education', 'platform', 'gamification']
                },
                isPublic: false,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'E-commerce Enhancement',
                description: 'Platform optimization for Retail Solutions Inc',
                clientName: 'Retail Solutions Inc',
                clientEmail: 'sales@retailsolutions.com',
                status: 'SENT',
                type: 'PROPOSAL',
                content: {
                    executiveSummary: 'E-commerce platform enhancement to improve conversion rates and user experience.',
                    approach: 'Performance optimization, UX improvements, and advanced analytics integration.',
                    budgetDetails: 'Total project cost: $18,000\n- Performance Audit: $3,000\n- UX Improvements: $8,000\n- Analytics Integration: $4,000\n- Testing & Optimization: $3,000',
                    timeline: '10 weeks\n- Weeks 1-2: Audit and Analysis\n- Weeks 3-7: Development\n- Weeks 8-9: Testing\n- Week 10: Deployment'
                },
                metadata: {
                    estimatedValue: 18000,
                    probability: 0.75,
                    tags: ['e-commerce', 'optimization', 'analytics']
                },
                isPublic: false,
                userId: user.id,
                organizationId: organization.id,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ];
        const createdProposals = [];
        for (const proposalData of proposals) {
            const proposal = await database_1.prisma.proposal.create({
                data: proposalData
            });
            createdProposals.push(proposal);
        }
        console.log('📋 Creating test snippets...');
        const snippets = [
            {
                title: 'Executive Summary Template',
                content: 'We are excited to present this comprehensive proposal that addresses your specific needs and demonstrates our commitment to delivering exceptional results.',
                category: 'General',
                tags: ['executive-summary', 'template'],
                usageCount: 15,
                isActive: true,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Budget Breakdown',
                content: 'Our pricing structure is transparent and value-driven:\n\n• Project Planning: $X,XXX\n• Development: $X,XXX\n• Testing & QA: $X,XXX\n• Deployment: $X,XXX\n• Support: $X,XXX',
                category: 'Pricing',
                tags: ['budget', 'pricing', 'transparent'],
                usageCount: 8,
                isActive: true,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Timeline Section',
                content: 'Project Timeline:\n\nPhase 1 (Weeks 1-4): Planning and Design\nPhase 2 (Weeks 5-8): Development\nPhase 3 (Weeks 9-10): Testing\nPhase 4 (Weeks 11-12): Deployment',
                category: 'Timeline',
                tags: ['timeline', 'phases', 'schedule'],
                usageCount: 12,
                isActive: true,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Value Proposition',
                content: 'Our solution will deliver:\n\n• 40% increase in efficiency\n• 25% reduction in costs\n• Improved user satisfaction\n• Scalable architecture for future growth',
                category: 'Value',
                tags: ['value-proposition', 'benefits', 'roi'],
                usageCount: 20,
                isActive: true,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        for (const snippetData of snippets) {
            await database_1.prisma.snippet.create({
                data: snippetData
            });
        }
        console.log('📊 Creating test case studies...');
        const caseStudies = [
            {
                title: 'E-commerce Platform Transformation',
                description: 'How we helped TechCorp increase online sales by 150%',
                clientName: 'TechCorp Solutions',
                industry: 'Technology',
                challenge: 'Outdated e-commerce platform with poor user experience and low conversion rates',
                solution: 'Developed a modern, responsive e-commerce platform with advanced features and optimized user experience',
                results: '150% increase in online sales, 40% improvement in conversion rates, 60% reduction in cart abandonment',
                metrics: {
                    salesIncrease: '150%',
                    conversionRate: '40%',
                    cartAbandonment: '60% reduction'
                },
                isActive: true,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Healthcare System Modernization',
                description: 'Streamlining patient care with custom software solutions',
                clientName: 'HealthFirst Medical',
                industry: 'Healthcare',
                challenge: 'Manual patient management processes causing delays and errors',
                solution: 'Custom healthcare management system with automated workflows and real-time reporting',
                results: '50% reduction in administrative time, 30% improvement in patient satisfaction, 100% compliance with HIPAA',
                metrics: {
                    timeReduction: '50%',
                    patientSatisfaction: '30%',
                    compliance: '100%'
                },
                isActive: true,
                organizationId: organization.id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        for (const caseStudyData of caseStudies) {
            await database_1.prisma.caseStudy.create({
                data: caseStudyData
            });
        }
        console.log('🔔 Creating test notifications...');
        const notifications = [
            {
                type: 'PROPOSAL_SENT',
                title: 'Proposal Sent Successfully',
                message: 'Your proposal "E-commerce Platform Development" has been sent to TechCorp Solutions',
                isRead: false,
                userId: user.id,
                metadata: {
                    proposalId: createdProposals[0].id,
                    clientName: 'TechCorp Solutions'
                },
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                type: 'PROPOSAL_VIEWED',
                title: 'Proposal Viewed',
                message: 'Your proposal "Medical Software Development" was viewed by HealthFirst Medical',
                isRead: true,
                userId: user.id,
                metadata: {
                    proposalId: createdProposals[2].id,
                    clientName: 'HealthFirst Medical'
                },
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                type: 'NEW_CLIENT',
                title: 'New Client Added',
                message: 'EduTech Innovations has been added to your client list',
                isRead: false,
                userId: user.id,
                metadata: {
                    clientId: createdClients[3].id,
                    clientName: 'EduTech Innovations'
                },
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            }
        ];
        for (const notificationData of notifications) {
            await database_1.prisma.notification.create({
                data: notificationData
            });
        }
        console.log('💬 Creating test comments...');
        const comments = [
            {
                content: 'Great proposal! The timeline looks realistic and the budget is well-structured.',
                userId: user.id,
                proposalId: createdProposals[0].id,
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                content: 'Consider adding more details about the technology stack and security measures.',
                userId: user.id,
                proposalId: createdProposals[2].id,
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                content: 'The value proposition is strong. This should resonate well with the client.',
                userId: user.id,
                proposalId: createdProposals[4].id,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ];
        for (const commentData of comments) {
            await database_1.prisma.comment.create({
                data: commentData
            });
        }
        console.log('✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`• Organization: 1`);
        console.log(`• User: 1`);
        console.log(`• Clients: ${createdClients.length}`);
        console.log(`• Templates: ${createdTemplates.length}`);
        console.log(`• Proposals: ${createdProposals.length}`);
        console.log(`• Snippets: 4`);
        console.log(`• Case Studies: 2`);
        console.log(`• Notifications: 3`);
        console.log(`• Comments: 3`);
        console.log('\n🔑 Test User Credentials:');
        console.log(`• Email: demo@proposalai.com`);
        console.log(`• Password: password123`);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};
seedData()
    .then(() => {
    console.log('🎉 Seeding completed!');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map