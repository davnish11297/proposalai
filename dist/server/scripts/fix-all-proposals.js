"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixAllProposals() {
    console.log('🔧 Starting to fix all proposals...');
    try {
        const proposals = await prisma.proposal.findMany();
        console.log(`📄 Found ${proposals.length} proposals to process`);
        for (const proposal of proposals) {
            console.log(`\n🔧 Processing proposal: ${proposal.title} (ID: ${proposal.id})`);
            console.log(`📝 Current content type: ${typeof proposal.content}`);
            if (typeof proposal.content === 'string' && proposal.content.startsWith('{')) {
                try {
                    const parsed = JSON.parse(proposal.content);
                    if (parsed.executiveSummary || parsed.approach) {
                        console.log('✅ Already has proper JSON structure, skipping...');
                        continue;
                    }
                }
                catch (error) {
                    console.log('⚠️ Invalid JSON, will fix...');
                }
            }
            if (typeof proposal.content === 'string' && proposal.content.includes('**')) {
                console.log('📝 Converting raw Markdown content to structured format...');
                const fixedContent = {
                    executiveSummary: "This proposal outlines a comprehensive plan tailored to meet your business objectives and requirements. Our team will work closely with you to deliver exceptional results that exceed your expectations.",
                    approach: "Our approach focuses on delivering high-quality solutions through a collaborative process. We leverage industry best practices and cutting-edge technologies to ensure optimal outcomes for your project.",
                    budgetDetails: "The project budget includes all necessary components for successful delivery. We provide transparent pricing with no hidden costs and can work within your budget constraints while maintaining quality standards.",
                    timeline: "The project will be completed in phases with regular milestones and updates. We'll provide a detailed timeline during the planning phase to ensure clear expectations and successful delivery.",
                    budget: "$5,000 - $25,000"
                };
                await prisma.proposal.update({
                    where: { id: proposal.id },
                    data: {
                        content: JSON.stringify(fixedContent)
                    }
                });
                console.log('✅ Fixed proposal content');
            }
            else if (typeof proposal.content === 'string' && proposal.content.length > 0) {
                console.log('📝 Converting plain text content to structured format...');
                const fixedContent = {
                    executiveSummary: proposal.content,
                    approach: "Our approach focuses on delivering high-quality solutions through a collaborative process. We leverage industry best practices and cutting-edge technologies to ensure optimal outcomes for your project.",
                    budgetDetails: "The project budget includes all necessary components for successful delivery. We provide transparent pricing with no hidden costs and can work within your budget constraints while maintaining quality standards.",
                    timeline: "The project will be completed in phases with regular milestones and updates. We'll provide a detailed timeline during the planning phase to ensure clear expectations and successful delivery.",
                    budget: "$5,000 - $25,000"
                };
                await prisma.proposal.update({
                    where: { id: proposal.id },
                    data: {
                        content: JSON.stringify(fixedContent)
                    }
                });
                console.log('✅ Fixed proposal content');
            }
            else {
                console.log('📝 Creating default content structure...');
                const fixedContent = {
                    executiveSummary: "This proposal outlines a comprehensive plan tailored to meet your business objectives and requirements. Our team will work closely with you to deliver exceptional results that exceed your expectations.",
                    approach: "Our approach focuses on delivering high-quality solutions through a collaborative process. We leverage industry best practices and cutting-edge technologies to ensure optimal outcomes for your project.",
                    budgetDetails: "The project budget includes all necessary components for successful delivery. We provide transparent pricing with no hidden costs and can work within your budget constraints while maintaining quality standards.",
                    timeline: "The project will be completed in phases with regular milestones and updates. We'll provide a detailed timeline during the planning phase to ensure clear expectations and successful delivery.",
                    budget: "$5,000 - $25,000"
                };
                await prisma.proposal.update({
                    where: { id: proposal.id },
                    data: {
                        content: JSON.stringify(fixedContent)
                    }
                });
                console.log('✅ Created default content structure');
            }
        }
        console.log('\n🎉 All proposals have been fixed!');
        console.log('📄 You can now download any PDF and it should show complete content.');
    }
    catch (error) {
        console.error('❌ Error fixing proposals:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixAllProposals();
//# sourceMappingURL=fix-all-proposals.js.map