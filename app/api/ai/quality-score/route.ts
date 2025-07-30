import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';

interface QualityMetrics {
  score: number; // 0-100
  readability: number;
  completeness: number;
  persuasiveness: number;
  structure: number;
  suggestions: Array<{
    type: 'missing' | 'improvement' | 'enhancement';
    category: 'content' | 'structure' | 'formatting' | 'strategy';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  industryInsights?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, industry, proposalType } = body;

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'Content too short for quality analysis' },
        { status: 400 }
      );
    }

    // Generate AI quality score and suggestions
    const qualityMetrics = await generateQualityScore(content, industry, proposalType);

    return NextResponse.json({
      success: true,
      data: qualityMetrics,
    });

  } catch (error) {
    console.error('Quality score error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze proposal quality' },
      { status: 500 }
    );
  }
}

async function generateQualityScore(
  content: string, 
  industry?: string, 
  proposalType?: string
): Promise<QualityMetrics> {
  const metrics = {
    readability: 0,
    completeness: 0,
    persuasiveness: 0,
    structure: 0,
  };

  const suggestions: QualityMetrics['suggestions'] = [];
  const industryInsights: string[] = [];

  // Readability Analysis (0-100)
  metrics.readability = analyzeReadability(content);
  
  // Completeness Analysis (0-100)
  const completenessResult = analyzeCompleteness(content);
  metrics.completeness = completenessResult.score;
  suggestions.push(...completenessResult.suggestions);

  // Persuasiveness Analysis (0-100)
  const persuasivenessResult = analyzePersuasiveness(content);
  metrics.persuasiveness = persuasivenessResult.score;
  suggestions.push(...persuasivenessResult.suggestions);

  // Structure Analysis (0-100)
  const structureResult = analyzeStructure(content);
  metrics.structure = structureResult.score;
  suggestions.push(...structureResult.suggestions);

  // Industry-specific insights
  if (industry) {
    industryInsights.push(...getIndustryInsights(content, industry));
  }

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (metrics.readability * 0.2 + 
     metrics.completeness * 0.3 + 
     metrics.persuasiveness * 0.3 + 
     metrics.structure * 0.2)
  );

  return {
    score: overallScore,
    readability: metrics.readability,
    completeness: metrics.completeness,
    persuasiveness: metrics.persuasiveness,
    structure: metrics.structure,
    suggestions,
    industryInsights,
  };
}

function analyzeReadability(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const characters = content.replace(/\s/g, '').length;

  if (sentences.length === 0 || words.length === 0) return 0;

  // Simple readability metrics
  const avgWordsPerSentence = words.length / sentences.length;
  const avgCharsPerWord = characters / words.length;

  // Ideal ranges: 15-20 words per sentence, 4-5 chars per word
  let score = 100;
  
  if (avgWordsPerSentence > 25) score -= 20;
  if (avgWordsPerSentence < 10) score -= 10;
  if (avgCharsPerWord > 6) score -= 15;
  if (avgCharsPerWord < 3) score -= 10;

  // Check for complex words (7+ characters)
  const complexWords = words.filter(w => w.length >= 7).length;
  const complexWordRatio = complexWords / words.length;
  if (complexWordRatio > 0.3) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function analyzeCompleteness(content: string): { score: number; suggestions: any[] } {
  const suggestions = [];
  let score = 100;
  
  const lowerContent = content.toLowerCase();
  
  // Essential sections check
  const essentialSections = [
    { name: 'Executive Summary', keywords: ['executive summary', 'overview', 'summary'], weight: 20 },
    { name: 'Project Scope', keywords: ['scope', 'deliverables', 'requirements'], weight: 15 },
    { name: 'Timeline', keywords: ['timeline', 'schedule', 'phases', 'milestones'], weight: 15 },
    { name: 'Budget/Pricing', keywords: ['budget', 'pricing', 'cost', 'price', '$'], weight: 20 },
    { name: 'Team/Expertise', keywords: ['team', 'experience', 'expertise', 'qualifications'], weight: 10 },
    { name: 'Next Steps', keywords: ['next steps', 'conclusion', 'moving forward'], weight: 10 },
    { name: 'Call to Action', keywords: ['contact', 'questions', 'discuss', 'meeting'], weight: 10 },
  ];

  essentialSections.forEach(section => {
    const hasSection = section.keywords.some(keyword => lowerContent.includes(keyword));
    if (!hasSection) {
      score -= section.weight;
      suggestions.push({
        type: 'missing' as const,
        category: 'content' as const,
        title: `Missing ${section.name}`,
        description: `Consider adding a ${section.name.toLowerCase()} section to improve completeness`,
        priority: section.weight >= 15 ? 'high' as const : 'medium' as const,
      });
    }
  });

  return { score: Math.max(0, score), suggestions };
}

function analyzePersuasiveness(content: string): { score: number; suggestions: any[] } {
  const suggestions = [];
  let score = 80; // Start with base score
  
  const lowerContent = content.toLowerCase();
  
  // Positive indicators
  const persuasiveElements = [
    { element: 'benefits', keywords: ['benefit', 'advantage', 'value', 'roi'], bonus: 10 },
    { element: 'social proof', keywords: ['client', 'customer', 'testimonial', 'case study'], bonus: 15 },
    { element: 'urgency', keywords: ['deadline', 'limited time', 'urgent', 'asap'], bonus: 5 },
    { element: 'credibility', keywords: ['certified', 'award', 'years of experience', 'proven'], bonus: 10 },
  ];

  persuasiveElements.forEach(element => {
    const hasElement = element.keywords.some(keyword => lowerContent.includes(keyword));
    if (hasElement) {
      score += element.bonus;
    } else {
      suggestions.push({
        type: 'enhancement' as const,
        category: 'strategy' as const,
        title: `Add ${element.element}`,
        description: `Include ${element.element} to increase persuasiveness`,
        priority: 'medium' as const,
      });
    }
  });

  // Check for weak language
  const weakWords = ['maybe', 'might', 'could', 'possibly', 'perhaps'];
  const hasWeakLanguage = weakWords.some(word => lowerContent.includes(word));
  if (hasWeakLanguage) {
    score -= 10;
    suggestions.push({
      type: 'improvement' as const,
      category: 'content' as const,
      title: 'Remove weak language',
      description: 'Replace uncertain words with confident, definitive language',
      priority: 'medium' as const,
    });
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions };
}

function analyzeStructure(content: string): { score: number; suggestions: any[] } {
  const suggestions = [];
  let score = 100;
  
  // Check for proper structure indicators
  const structureElements = [
    { element: 'headers', pattern: /#{1,6}\s|\*\*[^*]+\*\*/, weight: 20 },
    { element: 'lists', pattern: /^\s*[-*+]\s|^\s*\d+\.\s/m, weight: 15 },
    { element: 'paragraphs', check: (content: string) => content.split('\n\n').length >= 3, weight: 15 },
  ];

  structureElements.forEach(element => {
    let hasElement = false;
    
    if (element.pattern) {
      hasElement = element.pattern.test(content);
    } else if (element.check) {
      hasElement = element.check(content);
    }
    
    if (!hasElement) {
      score -= element.weight;
      suggestions.push({
        type: 'improvement' as const,
        category: 'structure' as const,
        title: `Improve ${element.element}`,
        description: `Add proper ${element.element} to improve document structure`,
        priority: 'medium' as const,
      });
    }
  });

  // Check document length (too short or too long)
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 200) {
    score -= 20;
    suggestions.push({
      type: 'improvement' as const,
      category: 'content' as const,
      title: 'Expand content',
      description: 'Proposal appears too brief. Consider adding more detail.',
      priority: 'high' as const,
    });
  } else if (wordCount > 2000) {
    score -= 10;
    suggestions.push({
      type: 'improvement' as const,
      category: 'content' as const,
      title: 'Condense content',
      description: 'Proposal may be too long. Consider making it more concise.',
      priority: 'low' as const,
    });
  }

  return { score: Math.max(0, score), suggestions };
}

function getIndustryInsights(content: string, industry: string): string[] {
  const insights = [];
  const lowerContent = content.toLowerCase();
  const lowerIndustry = industry.toLowerCase();
  
  // Industry-specific recommendations
  const industryRules: Record<string, any> = {
    'technology': {
      requiredTerms: ['technical specifications', 'scalability', 'security'],
      insights: [
        'Tech proposals convert 40% better with detailed technical specifications',
        'Include security and compliance details for enterprise clients',
        'Mention scalability and future-proofing capabilities'
      ]
    },
    'consulting': {
      requiredTerms: ['methodology', 'deliverables', 'timeline'],
      insights: [
        'Consulting proposals need clear methodology and process descriptions',
        'Include case studies from similar industry clients',
        'Emphasize ROI and measurable outcomes'
      ]
    },
    'design': {
      requiredTerms: ['creative process', 'revisions', 'deliverables'],
      insights: [
        'Design proposals should include revision policies',
        'Visual examples and portfolio references increase acceptance',
        'Specify file formats and usage rights clearly'
      ]
    }
  };
  
  const rules = industryRules[lowerIndustry];
  if (rules) {
    // Check for required terms
    rules.requiredTerms.forEach((term: string) => {
      if (!lowerContent.includes(term)) {
        insights.push(`Consider adding ${term} - important for ${industry} proposals`);
      }
    });
    
    // Add general insights
    insights.push(...rules.insights.slice(0, 2)); // Limit to 2 insights
  }
  
  return insights;
}