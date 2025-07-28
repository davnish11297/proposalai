"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../utils/database");
async function fixBrokenProposals() {
    try {
        console.log('🔍 Finding proposals with broken content...');
        const proposals = await database_1.prisma.proposal.findMany();
        let fixedCount = 0;
        for (const proposal of proposals) {
            try {
                const content = JSON.parse(proposal.content);
                console.log(`✅ Proposal "${proposal.title}" has valid JSON content`);
            }
            catch (error) {
                console.log(`📝 Found proposal with broken content: ${proposal.title} (${proposal.id})`);
                console.log(`   Content preview: ${proposal.content.substring(0, 100)}...`);
                const newContent = {
                    executiveSummary: `We are pleased to present this proposal for ${proposal.clientName || 'your project'}. This comprehensive proposal outlines our approach to delivering exceptional results.`,
                    problemStatement: `Based on our understanding, you require professional services to address your project needs. We have analyzed your requirements and developed a tailored solution.`,
                    solution: `Our comprehensive solution includes:\n- Detailed analysis and planning\n- Professional implementation\n- Ongoing support and maintenance\n- Quality assurance and testing`,
                    approach: `Our approach will follow these steps:\n1. Initial consultation and requirements gathering\n2. Solution design and planning\n3. Implementation and testing\n4. Review and feedback\n5. Final delivery and support`,
                    timeline: `Project Timeline: 4-6 weeks (flexible based on your needs)`,
                    pricing: `Investment: To be discussed based on final scope`,
                    budgetDetails: `The proposed budget covers all project phases, including planning, implementation, and support. A detailed breakdown can be provided upon request.`,
                    nextSteps: [
                        'Review and approve this proposal',
                        'Schedule kickoff meeting',
                        'Begin project implementation'
                    ]
                };
                await database_1.prisma.proposal.update({
                    where: { id: proposal.id },
                    data: {
                        content: JSON.stringify(newContent)
                    }
                });
                fixedCount++;
                console.log(`✅ Fixed proposal: ${proposal.title}`);
            }
        }
        console.log(`\n🎉 Fixed ${fixedCount} proposals with broken content`);
    }
    catch (error) {
        console.error('❌ Error fixing broken proposals:', error);
    }
    finally {
        process.exit(0);
    }
}
fixBrokenProposals()
    .then(() => {
    console.log('✅ Broken proposals fix completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=fix-broken-proposals.js.map