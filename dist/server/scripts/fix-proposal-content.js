"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixProposalContent() {
    console.log('🔧 Starting proposal content fix...');
    try {
        const proposal = await prisma.proposal.findFirst({
            where: {
                id: 'cmd85skrn0001jjtckegwcuu5'
            }
        });
        if (!proposal) {
            console.log('❌ Proposal not found');
            return;
        }
        console.log('📄 Found proposal:', proposal.title);
        console.log('📝 Current content type:', typeof proposal.content);
        const testContent = {
            executiveSummary: "This proposal outlines a comprehensive plan for the development of a new, modern, and user-friendly website tailored to meet your business objectives. The website will serve as a dynamic platform to enhance your online presence, improve user engagement, and drive conversions.",
            approach: "Our approach focuses on delivering a seamless user experience, responsive design, and robust functionality that aligns with your brand identity and goals. We understand the importance of a website as a critical touchpoint for your audience. Our team will leverage the latest web technologies, industry best practices, and a collaborative process to ensure the final product exceeds your expectations.",
            budgetDetails: "The project budget includes all design, development, testing, and deployment phases. We provide transparent pricing with no hidden costs and can work within your budget constraints while maintaining quality standards.",
            timeline: "The project will be completed in phases over 8-12 weeks, including planning, design, development, testing, and deployment. We'll provide regular updates and milestones throughout the process.",
            budget: "$10,000 - $15,000"
        };
        console.log('🔧 Creating clean content structure:', {
            hasExecutiveSummary: !!testContent.executiveSummary,
            hasApproach: !!testContent.approach,
            hasBudgetDetails: !!testContent.budgetDetails,
            hasTimeline: !!testContent.timeline,
            executiveSummaryPreview: testContent.executiveSummary.substring(0, 100) + '...',
            approachPreview: testContent.approach.substring(0, 100) + '...'
        });
        await prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                content: JSON.stringify(testContent)
            }
        });
        console.log('✅ Proposal content fixed successfully!');
        console.log('📄 You can now download the PDF and it should show the content properly.');
    }
    catch (error) {
        console.error('❌ Error fixing proposal content:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixProposalContent();
//# sourceMappingURL=fix-proposal-content.js.map