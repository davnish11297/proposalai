import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function cleanAllProposals() {
  try {
    const proposals = await db.proposal.findMany();
    let fixed = 0;
    for (const proposal of proposals) {
      let content = proposal.content;
      let needsUpdate = false;
      if (typeof content === 'string') {
        let cleaned = content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/\n\s*[-*+]\s/g, '\n- ')
          .replace(/\n\s*\d+\.\s/g, '\n1. ');
        try {
          content = JSON.parse(cleaned);
        } catch {
          content = { executiveSummary: cleaned };
        }
        needsUpdate = true;
      }
      if (typeof content !== 'object' || content === null) {
        content = {
          executiveSummary: 'Content could not be parsed. Please regenerate this proposal.',
          approach: 'Content could not be parsed. Please regenerate this proposal.',
          budgetDetails: 'Content could not be parsed. Please regenerate this proposal.',
          timeline: 'Content could not be parsed. Please regenerate this proposal.',
          budget: 'To be discussed'
        };
        needsUpdate = true;
      }
      if (needsUpdate) {
        await db.proposal.update({
          where: { id: proposal.id },
          data: { content: JSON.stringify(content) }
        });
        fixed++;
        console.log(`Fixed proposal: ${proposal.title}`);
      }
    }
    console.log(`\nCleaned ${fixed} proposals.`);
  } catch (error) {
    console.error('Error cleaning proposals:', error);
  } finally {
    await db.$disconnect();
  }
}

cleanAllProposals(); 