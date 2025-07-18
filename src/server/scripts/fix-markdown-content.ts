import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function fixMarkdownContent() {
  try {
    console.log('🔍 Finding proposals with Markdown formatting...');
    
    // Get all proposals
    const proposals = await db.proposal.findMany();
    
    let fixedCount = 0;
    
    for (const proposal of proposals) {
      try {
        // Try to parse the content as JSON
        const content = JSON.parse(proposal.content);
        
        // Check if content has any Markdown formatting
        const contentString = JSON.stringify(content);
        if (contentString.includes('**') || contentString.includes('*') || contentString.includes('`')) {
          console.log(`📝 Found proposal with Markdown: ${proposal.title} (${proposal.id})`);
          
          // Clean up the content
          const cleanedContent = cleanMarkdownFromObject(content);
          
          // Update the proposal
          await db.proposal.update({
            where: { id: proposal.id },
            data: {
              content: JSON.stringify(cleanedContent)
            }
          });
          
          fixedCount++;
          console.log(`✅ Fixed proposal: ${proposal.title}`);
        }
      } catch (error) {
        // If JSON parsing fails, the content might be a raw string with Markdown
        console.log(`📝 Found proposal with invalid JSON: ${proposal.title} (${proposal.id})`);
        
        try {
          // Try to clean the raw string content
          const cleanedContent = cleanMarkdownFromString(proposal.content);
          
          // Try to parse as JSON after cleaning
          const parsedContent = JSON.parse(cleanedContent);
          
          // Update the proposal
          await db.proposal.update({
            where: { id: proposal.id },
            data: {
              content: JSON.stringify(parsedContent)
            }
          });
          
          fixedCount++;
          console.log(`✅ Fixed proposal: ${proposal.title}`);
        } catch (parseError) {
          console.log(`❌ Could not fix proposal: ${proposal.title} - ${parseError}`);
        }
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} proposals with Markdown formatting`);
    
  } catch (error) {
    console.error('❌ Error fixing Markdown content:', error);
  } finally {
    await db.$disconnect();
  }
}

function cleanMarkdownFromObject(obj: any): any {
  if (typeof obj === 'string') {
    return cleanMarkdownFromString(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => cleanMarkdownFromObject(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanMarkdownFromObject(value);
    }
    return cleaned;
  }
  return obj;
}

function cleanMarkdownFromString(str: string): string {
  return str
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
    .replace(/`(.*?)`/g, '$1') // Remove code formatting
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/\n\s*[-*+]\s/g, '\n- ') // Normalize list markers
    .replace(/\n\s*\d+\.\s/g, '\n1. '); // Normalize numbered lists
}

// Run the script
fixMarkdownContent()
  .then(() => {
    console.log('✅ Markdown content fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 