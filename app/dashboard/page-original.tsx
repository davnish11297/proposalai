'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Utility functions moved outside component to prevent recreations
const htmlToMarkdown = (input: string): string => {
  return input
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<[^>]+>/g, '') // Remove any other HTML tags
    .replace(/\n{3,}/g, '\n\n'); // Collapse excessive newlines
};

const GENERIC_SUGGESTIONS = [
  "Add Executive Summary",
  "Include Budget Details", 
  "Add Timeline Section",
  "Highlight Key Benefits",
  "Clarify Project Scope",
  "Define Success Metrics",
  "Showcase Team Expertise",
  "Provide Case Studies",
  "Outline Deliverables",
  "Specify Payment Terms"
];

// Form options
const FORM_OPTIONS = {
  industries: [
    'Healthcare', 'Real Estate', 'SaaS/Software', 'Marketing/Advertising',
    'Finance/Banking', 'E-commerce', 'Education', 'Construction',
    'Manufacturing', 'Consulting', 'Non-profit', 'Government',
    'Technology', 'Retail', 'Hospitality', 'Transportation'
  ],
  proposalTypes: [
    'Project Pitch', 'Partnership/Collaboration', 'Product Launch',
    'Service Offering', 'Investment Proposal', 'RFP Response',
    'Grant Application', 'Contract Renewal', 'Expansion Proposal'
  ],
  targetAudiences: [
    'Client', 'Investor', 'Government Agency', 'Business Partner',
    'Internal Stakeholders', 'Board of Directors', 'Vendor',
    'Supplier', 'Consultant', 'Contractor'
  ],
  projectScopes: [
    'One-time project', 'Long-term collaboration', 'Pilot/Prototype',
    'Retainer-based', 'Ongoing service', 'Consultation',
    'Implementation', 'Training', 'Support & Maintenance'
  ],
  budgetRanges: [
    '<$5,000', '$5,000–$20,000', '$20,000–$100,000',
    '$100,000–$500,000', '$500,000+', 'Not specified'
  ],
  timelines: [
    'Immediate (1–2 weeks)', 'Short-term (1–3 months)',
    'Medium-term (3–6 months)', 'Long-term (6+ months)',
    'Ongoing', 'Not specified'
  ],
  problemStatements: [
    'Low customer retention', 'Inefficient workflow', 'Lack of online visibility',
    'Regulatory compliance issues', 'Poor product-market fit',
    'High operational costs', 'Limited market reach', 'Technology gaps',
    'Quality control issues', 'Scalability challenges'
  ],
  valuePropositions: [
    'Cost savings', 'Increased efficiency', 'Revenue growth',
    'Customer satisfaction', 'Innovation', 'Risk reduction',
    'Competitive advantage', 'Market expansion', 'Quality improvement',
    'Time savings'
  ],
  deliverables: [
    'Software solution', 'Marketing campaign', 'Market analysis report',
    'Product design', 'Legal documents', 'Strategy roadmap',
    'Training program', 'Consultation report', 'Implementation plan',
    'Support services'
  ],
  tones: [
    'Formal & Professional', 'Friendly & Persuasive', 'Technical & Detailed',
    'Visionary & Inspirational', 'Executive Summary Style',
    'Confident & Assertive', 'Collaborative & Partnership-focused'
  ]
};

// Dashboard component
export default function OriginalDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [proposalText, setProposalText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState({
    executiveSummary: '',
    approach: '',
    budgetDetails: '',
    timeline: '',
    fullContent: ''
  });
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadedPdfContent, setUploadedPdfContent] = useState<string>('');

  // Structured form state
  const [formData, setFormData] = useState({
    industry: '',
    proposalType: '',
    targetAudience: '',
    projectScope: '',
    budgetRange: '',
    timeline: '',
    problemStatement: '',
    valueProposition: [],
    deliverables: [],
    tone: ''
  });

  // State for suggestions
  const [predefinedSuggestions, setPredefinedSuggestions] = useState<Array<{
    text: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  }>>([]);
  
  const [refinementSuggestions, setRefinementSuggestions] = useState<Array<{
    text: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  }>>([]);

  // Generate AI content using OpenRouter
  const generateWithAI = useCallback(async (messages: any[]) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI content');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }, []);

  // Generate AI-based suggestions (generic)
  const generateSuggestions = useCallback(async () => {
    try {
      console.log('Starting AI suggestion generation...');
      const messages = [
        {
          role: 'system',
          content: 'You are an expert proposal writer. Generate 10 specific, actionable suggestions for improving a business proposal. Each suggestion should be concise (2-4 words) and focus on different aspects like content, structure, persuasion, and professionalism. Return only the suggestions, one per line, without numbering or bullet points.'
        },
        {
          role: 'user',
          content: 'Generate 10 proposal improvement suggestions.'
        }
      ];
      
      console.log('Calling AI API...');
      const response = await generateWithAI(messages);
      const aiSuggestions = response.content || '';
      console.log('AI Response:', aiSuggestions);
      
      // Parse AI suggestions and create suggestion objects
      const suggestions = aiSuggestions
        .split('\n')
        .filter((line: string) => line.trim())
        .slice(0, 10)
        .map((suggestion: string, index: number) => {
          const colors: Array<'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'> = ['blue', 'green', 'purple', 'orange', 'red', 'yellow'];
          const icons = [
            <svg key="icon1" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>,
            <svg key="icon2" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>,
            <svg key="icon3" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>,
            <svg key="icon4" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>,
            <svg key="icon5" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ];
          
          return {
            text: suggestion.trim(),
            icon: icons[index % icons.length],
            color: colors[index % colors.length]
          };
        });
      
      console.log('Parsed suggestions:', suggestions);
      setPredefinedSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to basic suggestions if AI fails
      setPredefinedSuggestions([
        {
          text: "Add Executive Summary",
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>,
          color: 'blue' as const
        },
        {
          text: "Include Budget Details",
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>,
          color: 'green' as const
        },
        {
          text: "Add Timeline Section",
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>,
          color: 'purple' as const
        }
      ]);
    }
  }, [generateWithAI]);

  // Generate AI-based refinement suggestions
  const generateRefinementSuggestions = useCallback(async (proposalContent: string) => {
    try {
      console.log('Starting refinement suggestion generation...');
      const messages = [
        {
          role: 'system',
          content: 'You are an expert proposal writer. Based on the provided proposal content, generate 10 specific, actionable suggestions for refining and improving the proposal. Each suggestion should be concise (2-4 words) and focus on different aspects like clarity, persuasion, structure, and impact. Return only the suggestions, one per line, without numbering or bullet points.'
        },
        {
          role: 'user',
          content: `Generate 10 refinement suggestions for this proposal:\n\n${proposalContent}`
        }
      ];
      
      console.log('Calling AI API for refinement suggestions...');
      const response = await generateWithAI(messages);
      const aiSuggestions = response.content || '';
      console.log('AI Refinement Response:', aiSuggestions);
      
      // Parse AI suggestions and create suggestion objects
      const suggestions = aiSuggestions
        .split('\n')
        .filter((line: string) => line.trim())
        .slice(0, 10)
        .map((suggestion: string, index: number) => {
          const colors: Array<'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'> = ['blue', 'green', 'purple', 'orange', 'red', 'yellow'];
          const icons = [
            <svg key="icon1" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>,
            <svg key="icon2" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>,
            <svg key="icon3" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>,
            <svg key="icon4" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>,
            <svg key="icon5" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ];
          
          return {
            text: suggestion.trim(),
            icon: icons[index % icons.length],
            color: colors[index % colors.length]
          };
        });
      
      console.log('Parsed refinement suggestions:', suggestions);
      setRefinementSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating refinement suggestions:', error);
      toast.error('Failed to generate refinement suggestions');
    }
  }, [generateWithAI]);

  // Handle PDF file upload and extraction
  const handlePdfUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // Call backend API to extract text from PDF
      const response = await fetch('/api/proposals/extract-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to extract PDF content');
      }

      const data = await response.json();
      const extractedText = data.content || data.text || '';
      
      if (extractedText.trim()) {
        setUploadedPdfContent(extractedText);
        toast.success('PDF uploaded successfully! You can now generate a refined proposal.');
      } else {
        toast.error('No readable text found in the PDF');
      }
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast.error('Failed to extract PDF content. Please try again.');
    } finally {
      setUploadingPdf(false);
      // Reset the file input
      event.target.value = '';
    }
  }, []);

  // Handle suggestion bubble click (select/unselect up to 5)
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : prev.length < 5 ? [...prev, suggestion] : prev
    );
  }, []);

  const handleGenerateWithAI = useCallback(async () => {
    // Check if we have either user input or uploaded PDF content
    if (!proposalText.trim() && !uploadedPdfContent.trim()) {
      toast.error('Please enter a proposal description or upload a PDF before generating content');
      return;
    }

    // Check required fields
    const requiredFields = ['industry', 'proposalType', 'targetAudience', 'timeline', 'tone'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    console.log('Form data:', formData);
    console.log('Missing fields:', missingFields);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      setGenerating(true);
      
      // Combine user input and uploaded PDF content
      const combinedContent = uploadedPdfContent.trim() 
        ? `${proposalText.trim() ? proposalText.trim() + '\n\n' : ''}PDF Content:\n${uploadedPdfContent.trim()}`
        : proposalText.trim();
      
      // Build structured context
      const context = {
        industry: formData.industry,
        proposalType: formData.proposalType,
        targetAudience: formData.targetAudience,
        projectScope: formData.projectScope,
        budgetRange: formData.budgetRange,
        timeline: formData.timeline,
        problemStatement: formData.problemStatement,
        valueProposition: formData.valueProposition.join(', '),
        deliverables: formData.deliverables.join(', '),
        tone: formData.tone
      };
      
      let systemPrompt = '';
      let userPrompt = '';
      
      if (uploadedPdfContent.trim()) {
        // PDF uploaded: Only refine, do not rewrite
        systemPrompt = `You are an expert proposal writer. Your task is to refine and improve the provided proposal content based on the user's instructions and structured context. Do NOT rewrite the entire proposal. Only make targeted improvements, edits, and enhancements. Preserve the original structure, sections, and as much of the original content as possible.`;
        userPrompt = `Here is the current proposal content (from a PDF):\n${uploadedPdfContent.trim()}\n\nUser's refinement instructions: ${proposalText.trim() ? proposalText.trim() : ''}${selectedSuggestions.length > 0 ? '\nRefinements: ' + selectedSuggestions.join(' | ') : ''}\n\nProposal Context:\n- Industry: ${context.industry}\n- Proposal Type: ${context.proposalType}\n- Target Audience: ${context.targetAudience}\n- Project Scope: ${context.projectScope || 'Not specified'}\n- Budget Range: ${context.budgetRange || 'Not specified'}\n- Timeline: ${context.timeline}\n- Problem Statement: ${context.problemStatement || 'Not specified'}\n- Value Proposition: ${context.valueProposition || 'Not specified'}\n- Deliverables: ${context.deliverables || 'Not specified'}\n- Tone: ${context.tone}\n\nPlease return the improved proposal, keeping the original structure and content, but making it better according to the instructions and context.`;
      } else {
        // No PDF: Use structured context for new proposals
        systemPrompt = `You are a professional business proposal writer.

I will provide you with:
- A short freeform idea from the user
- Structured context to help guide the proposal

Please generate a focused and compelling proposal **based only on the given information**, without adding unrelated assumptions.

### Instructions:
- DO NOT change the theme or logic of the user's original idea.
- Use the structured context to refine and enrich the proposal.
- Maintain a clear, professional tone based on the selected style.
- Avoid fluff or vagueness.
- Keep the structure appropriate for a business/client proposal.
- Include these sections: Executive Summary, Approach, Budget Details, Timeline.`;
        userPrompt = `### User Idea:\n${combinedContent}\n\n### Proposal Details:\n- Industry: ${context.industry}\n- Proposal Type: ${context.proposalType}\n- Target Audience: ${context.targetAudience}\n- Project Scope: ${context.projectScope || 'Not specified'}\n- Budget Range: ${context.budgetRange || 'Not specified'}\n- Timeline: ${context.timeline}\n- Problem Statement / Pain Point: ${context.problemStatement || 'Not specified'}\n- Value Proposition Focus: ${context.valueProposition || 'Not specified'}\n- Deliverables Expected: ${context.deliverables || 'Not specified'}\n- Tone of Proposal: ${context.tone}\n\n${proposalText.trim() ? 'Additional Instructions: ' + proposalText.trim() + '\n' : ''}${selectedSuggestions.length > 0 ? 'Refinements: ' + selectedSuggestions.join(' | ') + '\n' : ''}Generate a professional proposal with: 1. Executive Summary 2. Approach 3. Budget Details 4. Timeline`;
      }
      
      // Compose prompt for AI
      const messages = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ];

      const response = await generateWithAI(messages);
      const aiContent = response.content || '';

      let executiveSummary = '', approach = '', budgetDetails = '', timeline = '';
      const execMatch = aiContent.match(/(?:Executive Summary|EXECUTIVE SUMMARY)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Approach|APPROACH|Budget|BUDGET|Timeline|TIMELINE|Next Steps|NEXT STEPS)[:\s\n]|$)/i);
      const approachMatch = aiContent.match(/(?:Approach|APPROACH|Methodology|METHODOLOGY)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Budget|BUDGET|Timeline|TIMELINE|Next Steps|NEXT STEPS)[:\s\n]|$)/i);
      const budgetMatch = aiContent.match(/(?:Budget Details?|BUDGET DETAILS?|Pricing|PRICING)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Timeline|TIMELINE|Next Steps|NEXT STEPS)[:\s\n]|$)/i);
      const timelineMatch = aiContent.match(/(?:Timeline|TIMELINE|Schedule|SCHEDULE)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Next Steps|NEXT STEPS|Conclusion|CONCLUSION)[:\s\n]|$)/i);

      executiveSummary = execMatch?.[1]?.trim() || '';
      approach = approachMatch?.[1]?.trim() || '';
      budgetDetails = budgetMatch?.[1]?.trim() || '';
      timeline = timelineMatch?.[1]?.trim() || '';

      const cleanContent = (text: string) => {
        return text
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s+|\s+$/g, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
      };

      const fullContent = [
        htmlToMarkdown(cleanContent(executiveSummary)),
        htmlToMarkdown(cleanContent(approach)),
        htmlToMarkdown(cleanContent(budgetDetails)),
        htmlToMarkdown(cleanContent(timeline))
      ].filter(Boolean).join('\n\n');

      // Fallback: If fullContent is much shorter than aiContent, use aiContent directly
      if (fullContent.length < aiContent.length * 0.7) {
        setGeneratedContent({
          executiveSummary: '',
          approach: '',
          budgetDetails: '',
          timeline: '',
          fullContent: htmlToMarkdown(cleanContent(aiContent))
        });
      } else {
        setGeneratedContent({
          executiveSummary: htmlToMarkdown(cleanContent(executiveSummary)),
          approach: htmlToMarkdown(cleanContent(approach)),
          budgetDetails: htmlToMarkdown(cleanContent(budgetDetails)),
          timeline: htmlToMarkdown(cleanContent(timeline)),
          fullContent
        });
      }

      setTimeout(() => {
        setShowContent(true);
      }, 500);

      toast.success('Proposal generated successfully!');
      
      // Generate refinement suggestions for the new proposal
      generateRefinementSuggestions(aiContent);
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast.error('Failed to generate proposal content. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [proposalText, uploadedPdfContent, selectedSuggestions, generateWithAI, generateRefinementSuggestions]);

  // Save as Draft handler
  const handleSaveDraft = useCallback(async () => {
    setSavingDraft(true);
    try {
      const payload = {
        title: proposalText.slice(0, 60) || 'Untitled Proposal',
        description: proposalText,
        clientName: 'Client',
        type: 'PROPOSAL',
        status: 'DRAFT',
        content: generatedContent.fullContent,
      };

      const response = await fetch(proposalId ? `/api/proposals/${proposalId}` : '/api/proposals', {
        method: proposalId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save proposal');
      }

      const data = await response.json();
      if (!proposalId) {
        setProposalId(data.data._id || data.data.id);
      }
      
      toast.success('Proposal saved as draft!');
    } catch (error) {
      toast.error('Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  }, [proposalText, generatedContent.fullContent, proposalId]);

  // Send as Email handler
  const handleSendEmail = useCallback(async () => {
    if (!email) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!clientName) {
      toast.error('Please enter a client name.');
      return;
    }

    if (!proposalId) {
      toast.error('Please save the proposal as draft first.');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          recipientEmail: email,
          clientName: clientName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Proposal sent via email!');
      setShowEmailModal(false);
      setEmail('');
      setClientName('');
    } catch (error) {
      toast.error('Failed to send email.');
    } finally {
      setSendingEmail(false);
    }
  }, [email, clientName, proposalId]);

  // Download as PDF handler
  const handleDownloadPdf = useCallback(async () => {
    if (!proposalId) {
      toast.error('Please save the proposal as draft first.');
      return;
    }
    
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/download-pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'proposal.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  }, [proposalId]);

  // Initialize suggestions
  useEffect(() => {
    setLoadingSuggestions(true);
    // Shuffle and pick 5 unique suggestions
    const shuffled = GENERIC_SUGGESTIONS
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .slice(0, 5);

    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow'];
    const icons = [
      <svg key="icon1" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>,
      <svg key="icon2" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>,
      <svg key="icon3" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      <svg key="icon4" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>,
      <svg key="icon5" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ];

    setPredefinedSuggestions(
      shuffled.map((text, i) => ({
        text,
        icon: icons[i % icons.length],
        color: colors[i % colors.length] as 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow'
      }))
    );
    setLoadingSuggestions(false);
  }, []); // Empty dependency array is correct here

  // Conditional rendering moved to the end
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Modern Top Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">PA</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">ProposalAI</h1>
            </div>
            <div className="flex items-center space-x-1">
              <Link href="/dashboard" className="nav-link active">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link href="/drafts" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Drafts</span>
              </Link>
              <Link href="/sent-proposals" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Sent</span>
              </Link>
              <Link href="/clients" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Clients</span>
              </Link>
              <Link href="/profile" className="nav-link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </Link>
              <button 
                onClick={logout}
                className="nav-link text-gray-500 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* BizBoost-inspired Main Content */}
      <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-8">
        {!showContent ? (
          // Two-column layout with structured form sidebar
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content area */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What can I help with?</h2>
              <p className="text-gray-600 mb-6">Describe your proposal needs and I'll help you create a compelling, professional document.</p>
              
              {/* Text box with integrated PDF upload */}
              <div className="w-full relative mb-6">
                {/* PDF Upload Status */}
                {uploadedPdfContent && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    PDF uploaded successfully
                  </div>
                )}
                
                <textarea
                  className="w-full h-[150px] rounded-xl border border-gray-200 px-6 py-4 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none font-normal text-gray-900 placeholder-gray-400"
                  placeholder="Ask ProposalAI or type / to see prompts..."
                  value={proposalText}
                  onChange={e => setProposalText(e.target.value)}
                  disabled={generating}
                />
                
                {/* AI Icons inside text box */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">GA</span>
                  </div>
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Popular Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Popular Actions</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Define Success Metrics */}
                                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 cursor-pointer hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Define Success Metrics</h4>
                        <p className="text-xs text-gray-600">Set clear KPIs and measurable outcomes.</p>
                      </div>
                    </div>
                  </div>

                  {/* Specify Payment Terms */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 cursor-pointer hover:bg-green-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Specify Payment Terms</h4>
                        <p className="text-xs text-gray-600">Outline pricing structure and payment schedule.</p>
                      </div>
                    </div>
                  </div>

                  {/* Include Budget Details */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 cursor-pointer hover:bg-purple-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Include Budget Details</h4>
                        <p className="text-xs text-gray-600">Break down costs and resource allocation.</p>
                      </div>
                    </div>
                  </div>

                  {/* Showcase Team Expertise */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 cursor-pointer hover:bg-orange-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Showcase Team Expertise</h4>
                        <p className="text-xs text-gray-600">Highlight relevant experience and credentials.</p>
                      </div>
                    </div>
                  </div>

                  {/* Outline Deliverables */}
                  <div className="bg-blue-gray-50 border border-blue-gray-200 rounded-xl p-3 cursor-pointer hover:bg-blue-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-gray-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Outline Deliverables</h4>
                        <p className="text-xs text-gray-600">Detail specific outputs and milestones.</p>
                      </div>
                    </div>
                  </div>

                  {/* Add Timeline */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 cursor-pointer hover:bg-indigo-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Add Timeline</h4>
                        <p className="text-xs text-gray-600">Define project phases and deadlines.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                    + Add Context
                  </button>
                  <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                    </svg>
                    Use Template
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      setProposalText('');
                      setSelectedSuggestions([]);
                      setUploadedPdfContent('');
                      setShowContent(false);
                      setGeneratedContent({
                        executiveSummary: '',
                        approach: '',
                        budgetDetails: '',
                        timeline: '',
                        fullContent: ''
                      });
                      // Reset form data
                      setFormData({
                        industry: '',
                        proposalType: '',
                        targetAudience: '',
                        projectScope: '',
                        budgetRange: '',
                        timeline: '',
                        problemStatement: '',
                        valueProposition: [],
                        deliverables: [],
                        tone: ''
                      });
                    }}
                    disabled={generating}
                  >
                    New
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleGenerateWithAI}
                    disabled={generating}
                  >
                    {generating ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </div>
                    ) : (
                      'Generate Proposal'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Form Sidebar */}
            <div className="lg:w-[420px] bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Proposal Context</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Industry/Domain */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Industry/Domain <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm ${
                      !formData.industry ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Industry</option>
                    {FORM_OPTIONS.industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {!formData.industry && (
                    <p className="text-xs text-red-600 mt-1">Please select an industry</p>
                  )}
                </div>

                {/* Proposal Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Proposal Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.proposalType}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposalType: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm ${
                      !formData.proposalType ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Type</option>
                    {FORM_OPTIONS.proposalTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {!formData.proposalType && (
                    <p className="text-xs text-red-600 mt-1">Please select a proposal type</p>
                  )}
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Target Audience <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm ${
                      !formData.targetAudience ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Audience</option>
                    {FORM_OPTIONS.targetAudiences.map(audience => (
                      <option key={audience} value={audience}>{audience}</option>
                    ))}
                  </select>
                  {!formData.targetAudience && (
                    <p className="text-xs text-red-600 mt-1">Please select a target audience</p>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Timeline <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm ${
                      !formData.timeline ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Timeline</option>
                    {FORM_OPTIONS.timelines.map(timeline => (
                      <option key={timeline} value={timeline}>{timeline}</option>
                    ))}
                  </select>
                  {!formData.timeline && (
                    <p className="text-xs text-red-600 mt-1">Please select a timeline</p>
                  )}
                </div>

                {/* Project Scope */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Project Scope
                  </label>
                  <select
                    value={formData.projectScope}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectScope: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm"
                  >
                    <option value="">Select Scope</option>
                    {FORM_OPTIONS.projectScopes.map(scope => (
                      <option key={scope} value={scope}>{scope}</option>
                    ))}
                  </select>
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Budget Range
                  </label>
                  <select
                    value={formData.budgetRange}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm"
                  >
                    <option value="">Select Budget</option>
                    {FORM_OPTIONS.budgetRanges.map(budget => (
                      <option key={budget} value={budget}>{budget}</option>
                    ))}
                  </select>
                </div>

                {/* Problem Statement */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Problem Statement
                  </label>
                  <select
                    value={formData.problemStatement}
                    onChange={(e) => setFormData(prev => ({ ...prev, problemStatement: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm"
                  >
                    <option value="">Select Problem</option>
                    {FORM_OPTIONS.problemStatements.map(problem => (
                      <option key={problem} value={problem}>{problem}</option>
                    ))}
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tone of Proposal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm ${
                      !formData.tone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Tone</option>
                    {FORM_OPTIONS.tones.map(tone => (
                      <option key={tone} value={tone}>{tone}</option>
                    ))}
                  </select>
                  {!formData.tone && (
                    <p className="text-xs text-red-600 mt-1">Please select a tone</p>
                  )}
                </div>
              </div>

              {/* Checkbox sections - full width */}
              <div className="mt-4 space-y-3">
                {/* Value Proposition */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Value Proposition Focus
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORM_OPTIONS.valuePropositions.map(prop => (
                      <label key={prop} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.valueProposition.includes(prop)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                valueProposition: [...prev.valueProposition, prop]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                valueProposition: prev.valueProposition.filter(p => p !== prop)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{prop}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Deliverables */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deliverables Expected
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORM_OPTIONS.deliverables.map(deliverable => (
                      <label key={deliverable} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.deliverables.includes(deliverable)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                deliverables: [...prev.deliverables, deliverable]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                deliverables: prev.deliverables.filter(d => d !== deliverable)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{deliverable}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Side-by-side layout when content is generated
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left side - Input and Refinement */}
            <div className="card-elevated p-8">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Refine Proposal</h2>
              
              {/* Text box with integrated PDF upload */}
              <div className="w-full relative mb-4">
                {/* PDF Upload Status */}
                {uploadedPdfContent && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    PDF uploaded successfully
                  </div>
                )}
                
                <textarea
                  className="w-full h-[180px] rounded-lg border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 resize-none"
                  placeholder={uploadedPdfContent ? "Add additional context or requirements (optional)..." : "Describe your client or project..."}
                  value={proposalText}
                  onChange={e => setProposalText(e.target.value)}
                  disabled={generating}
                />
              </div>

              {/* Refinement Suggestions */}
              <div className="w-full flex flex-wrap gap-2 mb-4 min-h-[40px]">
                {refinementSuggestions.map((s, i) => {
                  const isSelected = selectedSuggestions.includes(s.text);
                  const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                  
                  const baseClasses = "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border";
                  const selectedClasses = isSelected 
                    ? "bg-blue-100 text-blue-700 border-blue-300 shadow-sm" 
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300";
                  const disabledClasses = isDisabled 
                    ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200" 
                    : "";
                  
                  return (
                    <button
                      key={`refinement-${i}-${s.text}`}
                      onClick={() => !isDisabled && !generating && handleSuggestionClick(s.text)}
                      disabled={generating || isDisabled}
                      className={`${baseClasses} ${generating || isDisabled ? disabledClasses : selectedClasses}`}
                    >
                      {s.text}
                    </button>
                  );
                })}
              </div>
              
              {/* Refine and Clear buttons */}
              <div className="flex gap-3">
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleGenerateWithAI}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Refine'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setProposalText('');
                    setSelectedSuggestions([]);
                    setUploadedPdfContent('');
                    setShowContent(false);
                    setGeneratedContent({
                      executiveSummary: '',
                      approach: '',
                      budgetDetails: '',
                      timeline: '',
                      fullContent: ''
                    });
                    // Reset form data
                    setFormData({
                      industry: '',
                      proposalType: '',
                      targetAudience: '',
                      projectScope: '',
                      budgetRange: '',
                      timeline: '',
                      problemStatement: '',
                      valueProposition: [],
                      deliverables: [],
                      tone: ''
                    });
                  }}
                  disabled={generating}
                >
                  New
                </button>
              </div>
            </div>

            {/* Right side - Generated Proposal */}
            <div className="card-elevated p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Generated Proposal</h2>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-600 font-medium">Ready</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="prose prose-gray max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-7">
                    {generatedContent.fullContent}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="btn btn-success flex-1"
                >
                  {savingDraft ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="btn btn-primary"
                >
                  Send Email
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="btn btn-outline"
                >
                  {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading screen when generating */}
        {generating && !showContent && (
          <div className="flex flex-col items-center justify-center py-12 w-full">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2">Generating Your Proposal</h3>
            <p className="text-gray-600 text-center max-w-md">
              Our AI is crafting a professional proposal tailored to your requirements. This may take a few moments...
            </p>
          </div>
        )}

        {/* Loading screen for refinement state */}
        {generating && showContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Refining Your Proposal</h3>
              <p className="text-gray-600">
                Our AI is refining your proposal with the selected improvements. This may take a few moments...
              </p>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Send Proposal via Email</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter client's full name"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    disabled={sendingEmail}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="Recipient's email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={sendingEmail}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmail('');
                    setClientName('');
                  }}
                  className="btn btn-secondary"
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="btn btn-primary"
                  disabled={sendingEmail || !email.trim() || !clientName.trim()}
                >
                  {sendingEmail ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}