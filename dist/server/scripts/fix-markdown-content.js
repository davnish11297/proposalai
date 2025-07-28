"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../utils/database");
async function fixMarkdownContent() {
    try {
        console.log('🔍 Finding proposals with Markdown formatting...');
        const proposals = await database_1.prisma.proposal.findMany();
        let fixedCount = 0;
        for (const proposal of proposals) {
            try {
                const content = JSON.parse(proposal.content);
                const contentString = JSON.stringify(content);
                if (contentString.includes('**') || contentString.includes('*') || contentString.includes('`')) {
                    console.log(`📝 Found proposal with Markdown: ${proposal.title} (${proposal.id})`);
                    const cleanedContent = cleanMarkdownFromObject(content);
                    await database_1.prisma.proposal.update({
                        where: { id: proposal.id },
                        data: {
                            content: JSON.stringify(cleanedContent)
                        }
                    });
                    fixedCount++;
                    console.log(`✅ Fixed proposal: ${proposal.title}`);
                }
            }
            catch (error) {
                console.log(`📝 Found proposal with invalid JSON: ${proposal.title} (${proposal.id})`);
                try {
                    const cleanedContent = cleanMarkdownFromString(proposal.content);
                    const parsedContent = JSON.parse(cleanedContent);
                    await database_1.prisma.proposal.update({
                        where: { id: proposal.id },
                        data: {
                            content: JSON.stringify(parsedContent)
                        }
                    });
                    fixedCount++;
                    console.log(`✅ Fixed proposal: ${proposal.title}`);
                }
                catch (parseError) {
                    console.log(`❌ Could not fix proposal: ${proposal.title} - ${parseError}`);
                }
            }
        }
        console.log(`\n🎉 Fixed ${fixedCount} proposals with Markdown formatting`);
    }
    catch (error) {
        console.error('❌ Error fixing Markdown content:', error);
    }
    finally {
        process.exit(0);
    }
}
function cleanMarkdownFromObject(obj) {
    if (typeof obj === 'string') {
        return cleanMarkdownFromString(obj);
    }
    else if (Array.isArray(obj)) {
        return obj.map(item => cleanMarkdownFromObject(item));
    }
    else if (typeof obj === 'object' && obj !== null) {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            cleaned[key] = cleanMarkdownFromObject(value);
        }
        return cleaned;
    }
    return obj;
}
function cleanMarkdownFromString(str) {
    return str
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/\n\s*[-*+]\s/g, '\n- ')
        .replace(/\n\s*\d+\.\s/g, '\n1. ');
}
fixMarkdownContent()
    .then(() => {
    console.log('✅ Markdown content fix completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=fix-markdown-content.js.map