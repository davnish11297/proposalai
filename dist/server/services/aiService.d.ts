import { IGenerateProposalRequest, ISnippet, IOrganization } from '../types';
export declare class AIService {
    private static instance;
    private preferredProvider;
    private constructor();
    static getInstance(): AIService;
    generateProposal(request: IGenerateProposalRequest, organization: IOrganization, snippets: ISnippet[], caseStudies: any[], pricingModels: any[]): Promise<{
        content: any;
        suggestedSnippets: ISnippet[];
    }>;
    private generateWithProvider;
    private generateWithOpenAI;
    private generateWithHuggingFace;
    private generateWithOllama;
    private generateWithOpenRouter;
    private generateWithAnthropic;
    private generateWithDeepSeek;
    private generateWithTemplate;
    private generateTemplateContent;
    private generateTemplateProposal;
    enhanceContent(content: string, instructions: string): Promise<string>;
    generateSnippetSuggestions(context: string, category: string): Promise<string[]>;
    analyzeProposalEffectiveness(content: string): Promise<{
        score: number;
        suggestions: string[];
        strengths: string[];
        weaknesses: string[];
    }>;
    private buildSystemPrompt;
    private buildUserPrompt;
    private parseGeneratedContent;
    private suggestRelevantSnippets;
    private parseAnalysis;
}
export declare const aiService: AIService;
//# sourceMappingURL=aiService.d.ts.map