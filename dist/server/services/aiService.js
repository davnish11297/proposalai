"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required for OpenAI features');
    }
    return new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY,
    });
};
const getHuggingFaceClient = () => {
    if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY environment variable is required for Hugging Face features');
    }
    return {
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseURL: 'https://api-inference.huggingface.co/models/',
    };
};
const getDeepSeekClient = () => {
    if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY environment variable is required for DeepSeek features');
    }
    return {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1'
    };
};
const getAnthropicClient = () => {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for Anthropic features');
    }
    return new sdk_1.default({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
};
const getOpenRouterClient = () => {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY environment variable is required for OpenRouter features');
    }
    return {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1'
    };
};
class AIService {
    constructor() {
        this.preferredProvider = 'openai';
        this.preferredProvider = 'openrouter';
    }
    static getInstance() {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }
    async generateProposal(request, organization, snippets, caseStudies, pricingModels) {
        const systemPrompt = this.buildSystemPrompt(organization, snippets, caseStudies, pricingModels);
        const userPrompt = this.buildUserPrompt(request);
        const providers = ['openrouter', 'anthropic', 'openai', 'template'];
        for (const provider of providers) {
            try {
                const response = await this.generateWithProvider(provider, systemPrompt, userPrompt);
                if (response.success) {
                    let parsedContent;
                    if (provider === 'template') {
                        try {
                            parsedContent = JSON.parse(response.content);
                        }
                        catch (error) {
                            console.error('Failed to parse template content:', error);
                            return this.generateTemplateProposal(request, organization, snippets, caseStudies, pricingModels);
                        }
                    }
                    else {
                        parsedContent = this.parseGeneratedContent(response.content);
                    }
                    const suggestedSnippets = this.suggestRelevantSnippets(request, snippets);
                    return {
                        content: parsedContent,
                        suggestedSnippets,
                    };
                }
            }
            catch (error) {
                console.error(`${provider} generation failed:`, error);
                continue;
            }
        }
        return this.generateTemplateProposal(request, organization, snippets, caseStudies, pricingModels);
    }
    async generateWithProvider(provider, systemPrompt, userPrompt) {
        switch (provider) {
            case 'openrouter':
                return this.generateWithOpenRouter(systemPrompt, userPrompt);
            case 'anthropic':
                return this.generateWithAnthropic(systemPrompt, userPrompt);
            case 'openai':
                return this.generateWithOpenAI(systemPrompt, userPrompt);
            case 'huggingface':
                return this.generateWithHuggingFace(systemPrompt, userPrompt);
            case 'ollama':
                return this.generateWithOllama(systemPrompt, userPrompt);
            case 'deepseek':
                return this.generateWithDeepSeek(systemPrompt, userPrompt);
            case 'template':
                return this.generateWithTemplate(systemPrompt, userPrompt);
            default:
                throw new Error(`Unknown AI provider: ${provider}`);
        }
    }
    async generateWithOpenAI(systemPrompt, userPrompt) {
        try {
            const openai = getOpenAIClient();
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
            });
            const content = completion.choices[0]?.message?.content;
            return {
                content: content || '',
                success: !!content,
                provider: 'openai'
            };
        }
        catch (error) {
            return {
                content: '',
                success: false,
                provider: 'openai',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async generateWithHuggingFace(systemPrompt, userPrompt) {
        try {
            const client = getHuggingFaceClient();
            const model = 'microsoft/DialoGPT-medium';
            const response = await fetch(`${client.baseURL}${model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${client.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: `${systemPrompt}\n\n${userPrompt}`,
                    parameters: {
                        max_length: 1000,
                        temperature: 0.7,
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`Hugging Face API error: ${response.status}`);
            }
            const data = await response.json();
            const content = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
            return {
                content: content || '',
                success: !!content,
                provider: 'huggingface'
            };
        }
        catch (error) {
            return {
                content: '',
                success: false,
                provider: 'huggingface',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async generateWithOllama(systemPrompt, userPrompt) {
        try {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama2',
                    prompt: `${systemPrompt}\n\n${userPrompt}`,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 1000,
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            const data = await response.json();
            return {
                content: data.response || '',
                success: !!data.response,
                provider: 'ollama'
            };
        }
        catch (error) {
            return {
                content: '',
                success: false,
                provider: 'ollama',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async generateWithOpenRouter(systemPrompt, userPrompt) {
        try {
            const client = getOpenRouterClient();
            console.log('🌐 Attempting OpenRouter API call with Claude Sonnet 4...');
            const response = await fetch(`${client.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${client.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'ProposalAI'
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3-5-sonnet-20241022',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                })
            });
            console.log(`🌐 OpenRouter API response status: ${response.status}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`🌐 OpenRouter API error: ${response.status} - ${errorText}`);
                throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            console.log('🌐 OpenRouter API response data:', JSON.stringify(data, null, 2));
            const content = data.choices?.[0]?.message?.content;
            console.log('🌐 OpenRouter generated content:', content);
            return {
                content: content || '',
                success: !!content,
                provider: 'openrouter'
            };
        }
        catch (error) {
            console.error('🌐 OpenRouter generation error:', error);
            return {
                content: '',
                success: false,
                provider: 'openrouter',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async generateWithAnthropic(systemPrompt, userPrompt) {
        try {
            const client = getAnthropicClient();
            console.log('🤖 Attempting Anthropic Claude Sonnet 4 API call...');
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                temperature: 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
            });
            console.log(`🤖 Anthropic API response status: ${response.stop_reason}`);
            const content = response.content[0]?.type === 'text' ? response.content[0]?.text : '';
            console.log('🤖 Anthropic generated content:', content);
            return {
                content: content || '',
                success: !!content,
                provider: 'anthropic'
            };
        }
        catch (error) {
            console.error('🤖 Anthropic generation error:', error);
            return {
                content: '',
                success: false,
                provider: 'anthropic',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async generateWithDeepSeek(systemPrompt, userPrompt) {
        try {
            const client = getDeepSeekClient();
            console.log('🔍 Attempting DeepSeek API call...');
            const response = await fetch(`${client.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${client.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                })
            });
            console.log(`🔍 DeepSeek API response status: ${response.status}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`🔍 DeepSeek API error: ${response.status} - ${errorText}`);
                throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            console.log('🔍 DeepSeek API response data:', JSON.stringify(data, null, 2));
            const content = data.choices?.[0]?.message?.content;
            console.log('🔍 DeepSeek generated content:', content);
            return {
                content: content || '',
                success: !!content,
                provider: 'deepseek'
            };
        }
        catch (error) {
            console.error('🔍 DeepSeek generation error:', error);
            return {
                content: '',
                success: false,
                provider: 'deepseek',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async generateWithTemplate(systemPrompt, userPrompt) {
        const templateContent = this.generateTemplateContent(systemPrompt, userPrompt);
        return {
            content: templateContent,
            success: true,
            provider: 'template'
        };
    }
    generateTemplateContent(systemPrompt, userPrompt) {
        const clientMatch = userPrompt.match(/Client: (.+)/);
        const projectMatch = userPrompt.match(/Project Description: (.+)/);
        const budgetMatch = userPrompt.match(/Budget: (.+)/);
        const timelineMatch = userPrompt.match(/Timeline: (.+)/);
        const clientName = clientMatch ? clientMatch[1] : 'Valued Client';
        const projectDesc = projectMatch ? projectMatch[1] : 'Professional services';
        const budget = budgetMatch ? budgetMatch[1] : 'To be discussed';
        const timeline = timelineMatch ? timelineMatch[1] : 'Flexible';
        let content = {
            executiveSummary: `We are pleased to present this proposal for ${clientName} regarding ${projectDesc}.`,
            problemStatement: `Based on our understanding, you require professional services to address ${projectDesc}.`,
            solution: `Our comprehensive solution includes:\n- Detailed analysis and planning\n- Professional implementation\n- Ongoing support and maintenance`,
            approach: `Our approach will follow these steps:\n1. Initial consultation and requirements gathering\n2. Solution design and planning\n3. Implementation and testing\n4. Review and feedback\n5. Final delivery and support`,
            timeline: `Project Timeline: ${timeline}`,
            pricing: `Investment: ${budget}`,
            budgetDetails: `The proposed budget of ${budget} covers all project phases, including planning, implementation, and support. A detailed breakdown can be provided upon request.`,
            nextSteps: [
                'Review and approve this proposal',
                'Schedule kickoff meeting',
                'Begin project implementation'
            ]
        };
        for (const key in content) {
            const value = content[key];
            if (typeof value === 'string') {
                content[key] = value
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/`(.*?)`/g, '$1')
                    .replace(/#{1,6}\s/g, '')
                    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                    .replace(/\n\s*[-*+]\s/g, '\n- ')
                    .replace(/\n\s*\d+\.\s/g, '\n1. ');
            }
        }
        return JSON.stringify(content);
    }
    generateTemplateProposal(request, organization, snippets, caseStudies, pricingModels) {
        const valuePropsText = organization.valueProps && organization.valueProps.length > 0
            ? `\n\nOur key value propositions:\n${organization.valueProps.map(vp => `• ${vp}`).join('\n')}`
            : '';
        const content = {
            executiveSummary: `We are pleased to present this proposal for ${request.clientName} regarding ${request.projectDescription}.`,
            problemStatement: `Based on our understanding, you require professional services to address ${request.projectDescription}.`,
            solution: `Our comprehensive solution includes:\n- Detailed analysis and planning\n- Professional implementation\n- Ongoing support and maintenance${valuePropsText}`,
            approach: `Our approach will follow these steps:\n1. Initial consultation and requirements gathering\n2. Solution design and planning\n3. Implementation and testing\n4. Review and feedback\n5. Final delivery and support`,
            timeline: `Project Timeline: ${request.timeline || '4-6 weeks'}`,
            pricing: `Investment: ${request.budget || 'To be discussed'}`,
            budgetDetails: `The proposed budget of ${request.budget || 'To be discussed'} covers all project phases, including planning, implementation, and support. A detailed breakdown can be provided upon request.`,
            nextSteps: [
                'Review and approve this proposal',
                'Schedule kickoff meeting',
                'Begin project implementation'
            ]
        };
        const suggestedSnippets = this.suggestRelevantSnippets(request, snippets);
        return { content, suggestedSnippets };
    }
    async enhanceContent(content, instructions) {
        const providers = [this.preferredProvider, 'huggingface', 'template'];
        for (const provider of providers) {
            try {
                const response = await this.generateWithProvider(provider, "You are a professional proposal writer. Enhance the given content according to the instructions while maintaining the original structure and key information.", `Content to enhance:\n${content}\n\nInstructions: ${instructions}`);
                if (response.success) {
                    return response.content;
                }
            }
            catch (error) {
                console.error(`${provider} enhancement failed:`, error);
                continue;
            }
        }
        return content;
    }
    async generateSnippetSuggestions(context, category) {
        const providers = [this.preferredProvider, 'huggingface', 'template'];
        for (const provider of providers) {
            try {
                const response = await this.generateWithProvider(provider, "You are a proposal writing assistant. Generate 3-5 relevant content snippets for the given context and category.", `Context: ${context}\nCategory: ${category}\n\nGenerate relevant snippets:`);
                if (response.success) {
                    const suggestions = response.content.split('\n').filter(s => s.trim());
                    return suggestions.length > 0 ? suggestions : [];
                }
            }
            catch (error) {
                console.error(`${provider} snippet generation failed:`, error);
                continue;
            }
        }
        return [
            `Professional ${category} solution for ${context}`,
            `Comprehensive ${category} approach`,
            `Best practices in ${category}`,
            `Proven ${category} methodology`
        ];
    }
    async analyzeProposalEffectiveness(content) {
        const providers = [this.preferredProvider, 'huggingface', 'template'];
        for (const provider of providers) {
            try {
                const response = await this.generateWithProvider(provider, "You are a proposal effectiveness analyzer. Rate the proposal from 1-10 and provide specific feedback.", `Analyze this proposal:\n${content}`);
                if (response.success) {
                    return this.parseAnalysis(response.content);
                }
            }
            catch (error) {
                console.error(`${provider} analysis failed:`, error);
                continue;
            }
        }
        return {
            score: 7,
            suggestions: ['Consider adding more specific metrics', 'Include case studies if available'],
            strengths: ['Clear structure', 'Professional tone'],
            weaknesses: ['Could use more specific details'],
        };
    }
    buildSystemPrompt(organization, snippets, caseStudies, pricingModels) {
        const valuePropsText = organization.valueProps && organization.valueProps.length > 0
            ? `\nValue Propositions:\n${organization.valueProps.map(vp => `- ${vp}`).join('\n')}`
            : '';
        return `You are an AI assistant specialized in creating professional business proposals for ${organization.name}.

Organization Context:
- Company: ${organization.name}
- Industry: ${organization.industry || 'Technology'}
- Brand Voice: ${organization.brandVoice || 'Professional and friendly'}
- Website: ${organization.website || 'N/A'}${valuePropsText}

Available Content Snippets:
${snippets.map(s => `- ${s.title}: ${s.content.substring(0, 100)}...`).join('\n')}

Case Studies:
${caseStudies.map(cs => `- ${cs.title}: ${cs.description}`).join('\n')}

Pricing Models:
${pricingModels.map(pm => `- ${pm.name}: ${pm.description || 'Custom pricing'}`).join('\n')}

Instructions:
1. Create a professional, well-structured proposal
2. Use the organization's brand voice and tone
3. Incorporate relevant snippets and case studies naturally
4. Include clear pricing, budget details, approach, and timeline information
5. Make it client-focused and solution-oriented
6. Use professional language and formatting
7. Include executive summary, problem statement, solution, approach, timeline, pricing, budget details, and next steps
8. Emphasize the organization's value propositions throughout the proposal
9. IMPORTANT: Do NOT use Markdown formatting (no **bold**, *italic*, or other Markdown syntax)
10. Use plain text only - no special formatting characters

Format the response as a structured JSON object with these sections.`;
    }
    buildUserPrompt(request) {
        return `Create a proposal for:

Client: ${request.clientName}
${request.clientEmail ? `Email: ${request.clientEmail}` : ''}
Project Description: ${request.projectDescription}
${request.budget ? `Budget: ${request.budget}` : ''}
${request.timeline ? `Timeline: ${request.timeline}` : ''}
${request.requirements ? `Requirements: ${request.requirements.join(', ')}` : ''}
${request.customInstructions ? `Custom Instructions: ${request.customInstructions}` : ''}

Generate a comprehensive, professional proposal that addresses the client's needs and showcases our capabilities. Be sure to include a detailed approach/methodology section and a budget details section explaining the budget breakdown or rationale.`;
    }
    parseGeneratedContent(content) {
        try {
            const cleanedContent = content
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/`(.*?)`/g, '$1')
                .replace(/#{1,6}\s/g, '')
                .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                .replace(/\n\s*[-*+]\s/g, '\n- ')
                .replace(/\n\s*\d+\.\s/g, '\n1. ');
            return JSON.parse(cleanedContent);
        }
        catch {
            const sections = content.split('\n\n').filter(section => section.trim());
            return {
                sections: sections.map(section => ({
                    title: section.split('\n')[0] || 'Section',
                    content: section.split('\n').slice(1).join('\n')
                }))
            };
        }
    }
    suggestRelevantSnippets(request, snippets) {
        const relevantKeywords = [
            request.projectDescription,
            request.budget,
            request.timeline,
            ...(request.requirements || [])
        ].join(' ').toLowerCase();
        return snippets
            .filter(snippet => {
            const snippetText = `${snippet.title} ${snippet.content} ${snippet.tags.join(' ')}`.toLowerCase();
            return snippet.tags.some(tag => relevantKeywords.includes(tag.toLowerCase())) ||
                snippetText.includes(relevantKeywords.split(' ')[0]);
        })
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5);
    }
    parseAnalysis(analysis) {
        const lines = analysis.split('\n').filter(line => line.trim());
        let score = 5;
        const suggestions = [];
        const strengths = [];
        const weaknesses = [];
        lines.forEach(line => {
            if (line.toLowerCase().includes('score') || line.toLowerCase().includes('rating')) {
                const scoreMatch = line.match(/\d+/);
                if (scoreMatch)
                    score = parseInt(scoreMatch[0]);
            }
            else if (line.toLowerCase().includes('suggest') || line.toLowerCase().includes('improve')) {
                suggestions.push(line);
            }
            else if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('good')) {
                strengths.push(line);
            }
            else if (line.toLowerCase().includes('weakness') || line.toLowerCase().includes('improve')) {
                weaknesses.push(line);
            }
        });
        return { score, suggestions, strengths, weaknesses };
    }
}
exports.AIService = AIService;
exports.aiService = AIService.getInstance();
//# sourceMappingURL=aiService.js.map