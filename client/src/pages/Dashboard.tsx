import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOpenRouterChatCompletion } from '../services/api';
import { proposalsAPI } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import '../ProposalMarkdown.css';

// Utility to convert HTML tags to markdown
function htmlToMarkdown(input: string): string {
  return input
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<[^>]+>/g, '') // Remove any other HTML tags
    .replace(/\n{3,}/g, '\n\n'); // Collapse excessive newlines
}

const Dashboard: React.FC = () => {
  const [proposalText, setProposalText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState({
    executiveSummary: '',
    approach: '',
    budgetDetails: '',
    timeline: '',
    fullContent: '' // Added for react-markdown
  });
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadedPdfContent, setUploadedPdfContent] = useState<string>('');

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
      
      console.log('Calling OpenRouter API...');
      const response = await getOpenRouterChatCompletion(messages);
      const aiSuggestions = response.choices[0]?.message?.content || '';
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
  }, []);

  // Generate AI-based suggestions based on existing drafts
  const generateSuggestionsFromDrafts = useCallback(async () => {
    try {
      console.log('Starting draft-based suggestion generation...');
      
      // Fetch existing drafts to analyze
      const response = await fetch('/api/proposals/drafts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }
      
      const data = await response.json();
      const drafts = data.data || [];
      
      if (drafts.length === 0) {
        // If no drafts exist, fall back to generic suggestions
        await generateSuggestions();
        return;
      }
      
      // Combine content from recent drafts for analysis
      const recentDrafts = drafts.slice(0, 3); // Take last 3 drafts
      const draftContent = recentDrafts
        .map((draft: any) => draft.content || draft.fullContent || '')
        .filter((content: string) => content.trim())
        .join('\n\n');
      
      const messages = [
        {
          role: 'system',
          content: 'You are an expert proposal writer. Based on the provided existing proposal drafts, generate 10 specific, actionable suggestions for improving future proposals. Each suggestion should be concise (2-4 words) and focus on different aspects like content, structure, persuasion, and professionalism. Return only the suggestions, one per line, without numbering or bullet points.'
        },
        {
          role: 'user',
          content: `Generate 10 proposal improvement suggestions based on these existing drafts:\n\n${draftContent}`
        }
      ];
      
      console.log('Calling OpenRouter API for draft-based suggestions...');
      const aiResponse = await getOpenRouterChatCompletion(messages);
      const aiSuggestions = aiResponse.choices[0]?.message?.content || '';
      console.log('AI Draft-Based Response:', aiSuggestions);
      
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
      
      console.log('Parsed draft-based suggestions:', suggestions);
      setPredefinedSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating draft-based suggestions:', error);
      // Fall back to generic suggestions if draft-based generation fails
      await generateSuggestions();
    }
  }, [generateSuggestions]);

  // Generate AI-based refinement suggestions
  const generateRefinementSuggestions = async (proposalContent: string) => {
    try {
      console.log('Starting refinement suggestion generation...');
      console.log('Proposal content:', proposalContent);
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
      
      console.log('Calling OpenRouter API for refinement suggestions...');
      const response = await getOpenRouterChatCompletion(messages);
      const aiSuggestions = response.choices[0]?.message?.content || '';
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
            </svg>,
            <svg key="icon6" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
    } finally {
      // setLoadingRefinementSuggestions(false); // This line is removed
    }
  };

  // Handle PDF file upload and extraction
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Handle suggestion bubble click (select/unselect up to 5)
  const handleSuggestionClick = (suggestion: string) => {
    // If it's a predefined suggestion, insert the long form into the input
    if (SUGGESTION_LONG_FORM[suggestion]) {
      setProposalText(SUGGESTION_LONG_FORM[suggestion]);
      setSelectedSuggestions([suggestion]);
    } else {
      // fallback to old behavior for refinement suggestions
      setSelectedSuggestions(prev => 
        prev.includes(suggestion) 
          ? prev.filter(s => s !== suggestion)
          : [...prev, suggestion]
      );
    }
  };

  const handleGenerateWithAI = async () => {
    // Check if we have either user input or uploaded PDF content
    if (!proposalText.trim() && !uploadedPdfContent.trim()) {
      toast.error('Please enter a proposal description or upload a PDF before generating content');
      return;
    }
    
    try {
      setGenerating(true);
      
      // Combine user input and uploaded PDF content
      const combinedContent = uploadedPdfContent.trim() 
        ? `${proposalText.trim() ? proposalText.trim() + '\n\n' : ''}PDF Content:\n${uploadedPdfContent.trim()}`
        : proposalText.trim();
      
      // If there are selected suggestions, use them to refine the proposal
      let systemPrompt = `You are an expert proposal writer. Generate a professional proposal with these sections: Executive Summary, Approach, Budget Details, Timeline. Use clear, persuasive language.`;
      
      let userPrompt = `Content: ${combinedContent}\n\nGenerate a professional proposal with: 1. Executive Summary 2. Approach 3. Budget Details 4. Timeline`;
      
      // If there are selected suggestions, modify the prompt to include them
      if (selectedSuggestions.length > 0) {
        systemPrompt = `You are an expert proposal writer. Generate a professional proposal incorporating these refinements: ${selectedSuggestions.map(s => `"${s}"`).join(', ')}. Include: Executive Summary, Approach, Budget Details, Timeline.`;
        userPrompt = `Content: ${combinedContent}\n\nRefinements: ${selectedSuggestions.join(', ')}\n\nGenerate proposal with: 1. Executive Summary 2. Approach 3. Budget Details 4. Timeline`;
      }
      
      // Compose prompt for OpenRouter
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
      const response = await getOpenRouterChatCompletion(messages);
      const aiContent = response.choices[0]?.message?.content || '';
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
      setGeneratedContent({
        executiveSummary: htmlToMarkdown(cleanContent(executiveSummary)),
        approach: htmlToMarkdown(cleanContent(approach)),
        budgetDetails: htmlToMarkdown(cleanContent(budgetDetails)),
        timeline: htmlToMarkdown(cleanContent(timeline)),
        fullContent: [
          htmlToMarkdown(cleanContent(executiveSummary)),
          htmlToMarkdown(cleanContent(approach)),
          htmlToMarkdown(cleanContent(budgetDetails)),
          htmlToMarkdown(cleanContent(timeline))
        ].filter(Boolean).join('\n\n')
      });
      setTimeout(() => {
        setShowContent(true);
      }, 500);
      toast.success('Proposal generated successfully!');
      // Generate refinement suggestions for the new proposal
      generateRefinementSuggestions(aiContent);
    } catch (error) {
      console.error('Error generating proposal:', error);
      
      // Handle specific OpenRouter credit limit error
      if (error instanceof Error && error.message.includes('OpenRouter credits exhausted')) {
        toast.error('AI service credits exhausted. Please visit OpenRouter to add more credits or try again later.');
      } else {
        toast.error('Failed to generate proposal content. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Save as Draft handler
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const payload = {
        title: proposalText.slice(0, 60) || 'Untitled Proposal',
        description: proposalText,
        clientName: 'Client', // Optionally make this dynamic
        type: 'PROPOSAL',
        status: 'DRAFT',
        content: generatedContent.fullContent,
      };
      let response;
      if (proposalId) {
        response = await proposalsAPI.update(proposalId, payload);
      } else {
        response = await proposalsAPI.create(payload);
        setProposalId(response.data.data.id);
      }
      toast.success('Proposal saved as draft!');
    } catch (error) {
      toast.error('Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Send as Email handler
  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!proposalId) {
      toast.error('Please save the proposal as draft first.');
      return;
    }
    setSendingEmail(true);
    try {
      await proposalsAPI.sendEmail(proposalId, { recipientEmail: email });
      toast.success('Proposal sent via email!');
      setShowEmailModal(false);
      setEmail('');
    } catch (error) {
      toast.error('Failed to send email.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Download as PDF handler
  const handleDownloadPdf = async () => {
    if (!proposalId) {
      toast.error('Please save the proposal as draft first.');
      return;
    }
    setDownloadingPdf(true);
    try {
      const response = await proposalsAPI.downloadPDF(proposalId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // 1. Add the hardcoded generic suggestions array at the top of the component (after useState declarations)
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
    "Specify Payment Terms",
    "Include Visual Aids",
    "Summarize Next Steps",
    "Address Client Needs",
    "Demonstrate ROI",
    "List Project Milestones",
    "Add Contact Information",
    "Describe Methodology",
    "Include Testimonials",
    "Present Unique Value",
    "Explain Risk Mitigation",
    "Offer Flexible Options",
    "Detail Project Phases",
    "Show Compliance Info",
    "Add Legal Disclaimers",
    "Provide Support Plan",
    "Include Appendices",
    "Summarize Budget Assumptions",
    "Highlight Innovation",
    "Describe Communication Plan",
    "List Required Resources"
  ];

  // Add this mapping after GENERIC_SUGGESTIONS
  const SUGGESTION_LONG_FORM: Record<string, string> = {
    "Add Executive Summary": "Please include a concise executive summary that outlines the main objectives, value proposition, and key points of the proposal.",
    "Include Budget Details": "Provide a detailed budget breakdown, including all costs, fees, and payment terms associated with the project.",
    "Add Timeline Section": "Add a clear timeline section that outlines project phases, milestones, and expected completion dates.",
    "Highlight Key Benefits": "Emphasize the key benefits and unique selling points that make this proposal stand out for the client.",
    "Clarify Project Scope": "Clearly define the project scope, deliverables, and boundaries to set proper expectations.",
    "Define Success Metrics": "Specify measurable success metrics and KPIs to track the effectiveness of the project.",
    "Showcase Team Expertise": "Highlight the relevant experience and expertise of the team members who will work on this project.",
    "Provide Case Studies": "Include relevant case studies or examples of similar successful projects completed in the past.",
    "Outline Deliverables": "List all deliverables that will be provided to the client upon project completion.",
    "Specify Payment Terms": "Detail the payment terms, schedule, and accepted payment methods for the project.",
    "Include Visual Aids": "Incorporate charts, diagrams, or images to visually support and clarify proposal content.",
    "Summarize Next Steps": "Add a section that summarizes the next steps and actions required from both parties.",
    "Address Client Needs": "Demonstrate a clear understanding of the client's needs and how the proposal addresses them.",
    "Demonstrate ROI": "Explain the expected return on investment (ROI) and value the client will receive.",
    "List Project Milestones": "Break down the project into key milestones with associated deliverables and deadlines.",
    "Add Contact Information": "Provide up-to-date contact information for the main point of contact for this proposal.",
    "Describe Methodology": "Describe the methodology or approach that will be used to achieve the project goals.",
    "Include Testimonials": "Add testimonials or endorsements from previous clients to build trust and credibility.",
    "Present Unique Value": "Clearly articulate the unique value proposition that differentiates this proposal from competitors.",
    "Explain Risk Mitigation": "Identify potential risks and describe strategies for mitigating them throughout the project.",
    "Offer Flexible Options": "Present flexible options or packages to accommodate different client needs or budgets.",
    "Detail Project Phases": "Break the project into distinct phases and describe the objectives and deliverables for each.",
    "Show Compliance Info": "Include information about compliance with relevant standards, regulations, or certifications.",
    "Add Legal Disclaimers": "Add any necessary legal disclaimers or terms and conditions relevant to the proposal.",
    "Provide Support Plan": "Describe the support and maintenance plan offered after project delivery.",
    "Include Appendices": "Attach appendices with supplementary information, data, or references as needed.",
    "Summarize Budget Assumptions": "Summarize any assumptions made in the budget and clarify what is included or excluded.",
    "Highlight Innovation": "Highlight any innovative aspects or creative solutions proposed for the project.",
    "Describe Communication Plan": "Describe the communication plan, including frequency and methods of updates to the client.",
    "List Required Resources": "List any resources, materials, or information required from the client to begin the project."
  };

  // 2. Replace the useEffect that initializes suggestions with logic to randomize and set 5 unique suggestions from the array
  useEffect(() => {
    setLoadingSuggestions(true);
    // Shuffle and pick 5 unique suggestions
    const shuffled = GENERIC_SUGGESTIONS
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .slice(0, 5);
    // Use the same icon/color logic as before
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
  }, []);

  // REMOVED: Auto-generation useEffect that was causing unwanted generation when typing
  // Now generation only happens when user explicitly clicks Generate/Refine button

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-extrabold text-white tracking-wider drop-shadow">ProposalAI</h1>
            </div>
            <div className="flex items-center space-x-8">
              <a href="/dashboard" className="text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">Dashboard</a>
              <a href="/drafts" className="text-white/80 hover:text-white transition-colors">Drafts</a>
              <a href="/sent-proposals" className="text-white/80 hover:text-white transition-colors">Sent Proposals</a>
              <a href="/profile" className="text-white/80 hover:text-white transition-colors">Profile</a>
              <NotificationBell />
              <button 
                onClick={handleLogout}
                className="text-white/80 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-8">
        {!showContent ? (
          // Single centered card when no content is generated
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-6xl bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-10 flex flex-col items-center justify-center min-h-[480px] mx-auto">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center tracking-tight">What can I help with?</h2>
              
              {/* Text box with integrated PDF upload */}
              <div className="w-full relative mb-4">
                {/* PDF Upload Status - moved above text box */}
                {uploadedPdfContent && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    PDF uploaded successfully
                  </div>
                )}
                
                <textarea
                  className="w-full h-[180px] rounded-lg border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 resize-none font-normal"
                  placeholder="Ask ProposalAI or type / to see prompts..."
                  value={proposalText}
                  onChange={e => setProposalText(e.target.value)}
                  disabled={generating}
                />
                
                {/* PDF Upload Button inside text box */}
                <div className="absolute bottom-3 right-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    id="pdf-upload"
                    disabled={uploadingPdf}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition cursor-pointer ${
                      uploadingPdf 
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                        : uploadedPdfContent 
                        ? 'bg-green-100 hover:bg-green-200' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={uploadedPdfContent ? "PDF uploaded - Click to replace" : "Upload PDF"}
                  >
                    {uploadingPdf ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : uploadedPdfContent ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </label>
                </div>
              </div>

              {/* Initial Suggestions - SMALL TAGS STYLING */}
              {!showContent && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {loadingSuggestions ? (
                      // Loading placeholders
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-100 animate-pulse inline-flex items-center">
                          <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + (i * 10)}px` }}></div>
                        </div>
                      ))
                    ) : predefinedSuggestions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No suggestions available. Generate a proposal to see AI-powered suggestions.</p>
                      </div>
                    ) : (
                      predefinedSuggestions.map((suggestion, i) => {
                        const isSelected = selectedSuggestions.includes(suggestion.text);
                        const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                        
                        // Small, transparent styling for initial suggestions
                        const baseClasses = "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border";
                        const selectedClasses = isSelected 
                          ? "bg-blue-100 text-blue-700 border-blue-300 shadow-sm" 
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300";
                        const disabledClasses = isDisabled 
                          ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200" 
                          : "";
                        
                        return (
                          <button
                            key={`initial-${i}-${suggestion.text}`}
                            onClick={() => !isDisabled && !generating && handleSuggestionClick(suggestion.text)}
                            disabled={generating || isDisabled}
                            className={`${baseClasses} ${generating || isDisabled ? disabledClasses : selectedClasses}`}
                          >
                            {suggestion.text}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Refinement Suggestions - SMALL TAGS STYLING */}
              {showContent && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Removed loadingRefinementSuggestions placeholder */}
                    {refinementSuggestions.length === 0 ? (
                      <div className="col-span-full text-center text-gray-500 py-4 font-normal">
                        No refinement suggestions available. Generate a proposal first to see AI-powered refinement suggestions.
                      </div>
                    ) : (
                      <div className="col-span-full flex flex-wrap gap-2">
                        {refinementSuggestions.map((suggestion, i) => {
                          const isSelected = selectedSuggestions.includes(suggestion.text);
                          const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                          
                          // Small, transparent styling for refinement suggestions
                          const baseClasses = "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border";
                          const selectedClasses = isSelected 
                            ? "bg-blue-100 text-blue-700 border-blue-300 shadow-sm" 
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300";
                          const disabledClasses = isDisabled 
                            ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200" 
                            : "";
                          
                          return (
                            <button
                              key={`refinement-${i}-${suggestion.text}`}
                              onClick={() => !isDisabled && !generating && handleSuggestionClick(suggestion.text)}
                              disabled={generating || isDisabled}
                              className={`${baseClasses} ${generating || isDisabled ? disabledClasses : selectedClasses}`}
                            >
                              {suggestion.text}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Generate and Clear buttons */}
              <div className="flex gap-4 mt-2 w-full justify-center">
                <button
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-60"
                  onClick={handleGenerateWithAI}
                  disabled={generating || !proposalText.trim()}
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
                <button
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold shadow-md hover:bg-gray-300 transition"
                  onClick={() => {
                    setProposalText('');
                    setSelectedSuggestions([]);
                    setUploadedPdfContent(''); // Clear PDF content
                  }}
                  disabled={generating}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Side-by-side layout when content is generated
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left side - Input and Refinement */}
            <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Refine Proposal</h2>
              
              {/* Text box with integrated PDF upload */}
              <div className="w-full relative mb-4">
                {/* PDF Upload Status - moved above text box */}
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
                
                {/* PDF Upload Button inside text box */}
                <div className="absolute bottom-3 right-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    id="pdf-upload-refine"
                    disabled={uploadingPdf}
                  />
                  <label
                    htmlFor="pdf-upload-refine"
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition cursor-pointer ${
                      uploadingPdf 
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                        : uploadedPdfContent 
                        ? 'bg-green-100 hover:bg-green-200' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={uploadedPdfContent ? "PDF uploaded - Click to replace" : "Upload PDF"}
                  >
                    {uploadingPdf ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : uploadedPdfContent ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </label>
                </div>
              </div>

              {/* Suggestions - SMALL TAGS STYLING */}
              <div className="w-full flex flex-wrap gap-2 mb-4 min-h-[40px]">
                {/* Removed loadingRefinementSuggestions placeholder */}
                {refinementSuggestions.map((s, i) => {
                  const isSelected = selectedSuggestions.includes(s.text);
                  const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                  
                  // Small, transparent styling for refinement suggestions
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
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-60 flex-1"
                  onClick={async () => {
                    setGenerating(true);
                    // Regenerate proposal with selected suggestions
                    await handleGenerateWithAI();
                  }}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Refine'}
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold shadow-md hover:bg-gray-300 transition"
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
                  }}
                  disabled={generating}
                >
                  New
                </button>
              </div>
            </div>

            {/* Right side - Generated Proposal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Generated Proposal</h2>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Ready</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-6">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-700 leading-7 mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside text-gray-700 leading-7 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside text-gray-700 leading-7 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                    }}
                  >
                    {generatedContent.fullContent}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60 flex-1"
                >
                  {savingDraft ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Send Email
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                >
                  {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading screen below the box when generating */}
        {generating && !showContent && (
          <div className="flex flex-col items-center justify-center py-12 w-full">
            <div className="relative">
              {/* Animated circles */}
              <div className="absolute inset-0 animate-ping">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
              </div>
              <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20"></div>
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
                {/* Animated circles */}
                <div className="absolute inset-0 animate-ping">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
                </div>
                <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20"></div>
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
        {/* Email Modal (if needed) */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Send Proposal via Email</h2>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Recipient's email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={sendingEmail}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                  disabled={sendingEmail}
                >Cancel</button>
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60"
                  disabled={sendingEmail}
                >{sendingEmail ? 'Sending...' : 'Send'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
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
};

export default Dashboard; 