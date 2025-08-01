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
    
    try {
      setGenerating(true);
      
      // Combine user input and uploaded PDF content
      const combinedContent = uploadedPdfContent.trim() 
        ? `${proposalText.trim() ? proposalText.trim() + '\n\n' : ''}PDF Content:\n${uploadedPdfContent.trim()}`
        : proposalText.trim();
      
      let systemPrompt = '';
      let userPrompt = '';
      
      if (uploadedPdfContent.trim()) {
        // PDF uploaded: Only refine, do not rewrite
        systemPrompt = `You are an expert proposal writer. Your task is to refine and improve the provided proposal content based on the user's instructions. Do NOT rewrite the entire proposal. Only make targeted improvements, edits, and enhancements. Preserve the original structure, sections, and as much of the original content as possible.`;
        userPrompt = `Here is the current proposal content (from a PDF):\n${uploadedPdfContent.trim()}\n\nUser's refinement instructions: ${proposalText.trim() ? proposalText.trim() : ''}${selectedSuggestions.length > 0 ? '\nRefinements: ' + selectedSuggestions.join(' | ') : ''}\n\nPlease return the improved proposal, keeping the original structure and content, but making it better according to the instructions.`;
      } else {
        // No PDF: Use original prompt for new proposals
        systemPrompt = `You are an expert proposal writer. Generate a professional proposal with these sections: Executive Summary, Approach, Budget Details, Timeline. Use clear, persuasive language.`;
        userPrompt = `Content: ${combinedContent}\n\n${proposalText.trim() ? 'Instructions: ' + proposalText.trim() + '\n' : ''}${selectedSuggestions.length > 0 ? 'Refinements: ' + selectedSuggestions.join(' | ') + '\n' : ''}Generate a professional proposal with: 1. Executive Summary 2. Approach 3. Budget Details 4. Timeline`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
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

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-8">
        {!showContent ? (
          // Single centered card when no content is generated
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-6xl card-elevated p-10 flex flex-col items-center justify-center min-h-[480px] mx-auto">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center tracking-tight">What can I help with?</h2>
              
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
                  className="w-full h-[180px] rounded-lg border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 resize-none font-normal text-gray-900"
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
                      <LoadingSpinner size="sm" />
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

              {/* Initial Suggestions */}
              {!showContent && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {loadingSuggestions ? (
                      // Loading placeholders
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-100 animate-pulse inline-flex items-center">
                          <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + (i * 10)}px` }}></div>
                        </div>
                      ))
                    ) : (
                      predefinedSuggestions.map((suggestion, i) => {
                        const isSelected = selectedSuggestions.includes(suggestion.text);
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
              
              {/* Generate and Clear buttons */}
              <div className="flex gap-4 mt-2 w-full justify-center">
                <button
                  className="btn btn-primary px-8 py-3"
                  onClick={handleGenerateWithAI}
                  disabled={generating || (!proposalText.trim() && !uploadedPdfContent.trim())}
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
                <button
                  className="btn btn-secondary px-8 py-3"
                  onClick={() => {
                    setProposalText('');
                    setSelectedSuggestions([]);
                    setUploadedPdfContent('');
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