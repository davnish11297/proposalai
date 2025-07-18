import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getOpenRouterChatCompletion } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../ProposalMarkdown.css';
import { proposalsAPI } from '../services/api';

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
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
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadedPdfContent, setUploadedPdfContent] = useState<string>('');

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

  // Generate refinement suggestions based on the generated proposal
  const generateRefinementSuggestions = useCallback(async (proposal: string) => {
    setLoadingSuggestions(true);
    // Clear selected suggestions when generating new ones
    setSelectedSuggestions([]);
    try {
      // Create different prompt variations for variety
      const promptVariations = [
        {
          role: 'system',
          content: `You are an expert proposal consultant. Suggest 4-6 actionable ways to refine this proposal. Each suggestion should be short and specific.`,
        },
        {
          role: 'system',
          content: `You are a creative proposal strategist. Suggest 4-6 unique ways to enhance this proposal. Think outside the box.`,
        },
        {
          role: 'system',
          content: `You are a proposal optimization expert. Suggest 4-6 specific improvements for this proposal. Focus on overlooked areas.`,
        }
      ];
      
      // Randomly select a prompt variation
      const randomPrompt = promptVariations[Math.floor(Math.random() * promptVariations.length)];
      
      const messages = [
        randomPrompt,
        {
          role: 'user',
          content: `Proposal: ${proposal}\n\nWhat are some ways to refine this proposal?`,
        },
      ];
      const response = await getOpenRouterChatCompletion(messages);
      const aiContent = response.choices[0]?.message?.content || '';
      const lines = aiContent.split('\n').filter((line: string) => line.trim());
      const aiSuggestions = lines
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 10 && suggestion.length < 200)
        .slice(0, 6);
      
      // If we got suggestions, use them; otherwise use fallback
      if (aiSuggestions.length > 0) {
        setSuggestions(aiSuggestions);
      } else {
        // Use different fallback suggestions each time
        const fallbackVariations = [
          [
            'Add a competitive analysis section.',
            'Include a risk mitigation strategy.',
            'Suggest a phased rollout plan.',
            'Expand on the project timeline with milestones.',
            'Clarify the deliverables and success metrics.',
            'Add a section on post-launch support.'
          ],
          [
            'Include a technology stack overview.',
            'Add a team structure and roles section.',
            'Provide detailed cost breakdown.',
            'Include quality assurance processes.',
            'Add a communication plan.',
            'Include a change management strategy.'
          ],
          [
            'Add a market analysis section.',
            'Include performance metrics and KPIs.',
            'Provide alternative solutions.',
            'Add a resource allocation plan.',
            'Include a contingency plan.',
            'Add a stakeholder management section.'
          ]
        ];
        const randomFallback = fallbackVariations[Math.floor(Math.random() * fallbackVariations.length)];
        setSuggestions(randomFallback);
      }
    } catch (error) {
      console.error('Error generating refinement suggestions:', error);
      
      // Handle specific OpenRouter credit limit error
      if (error instanceof Error && error.message.includes('OpenRouter credits exhausted')) {
        console.warn('OpenRouter credits exhausted, using fallback suggestions');
      }
      
      // Use different fallback suggestions on error
      const fallbackVariations = [
        [
          'Add a competitive analysis section.',
          'Include a risk mitigation strategy.',
          'Suggest a phased rollout plan.',
          'Expand on the project timeline with milestones.',
          'Clarify the deliverables and success metrics.',
          'Add a section on post-launch support.'
        ],
        [
          'Include a technology stack overview.',
          'Add a team structure and roles section.',
          'Provide detailed cost breakdown.',
          'Include quality assurance processes.',
          'Add a communication plan.',
          'Include a change management strategy.'
        ],
        [
          'Add a market analysis section.',
          'Include performance metrics and KPIs.',
          'Provide alternative solutions.',
          'Add a resource allocation plan.',
          'Include a contingency plan.',
          'Add a stakeholder management section.'
        ]
      ];
      const randomFallback = fallbackVariations[Math.floor(Math.random() * fallbackVariations.length)];
      setSuggestions(randomFallback);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Handle suggestion bubble click (select/unselect up to 5)
  const handleSuggestionToggle = (suggestion: string) => {
    setSelectedSuggestions(prev => {
      if (prev.includes(suggestion)) {
        return prev.filter(s => s !== suggestion);
      } else if (prev.length < 5) {
        return [...prev, suggestion];
      } else {
        return prev;
      }
    });
  };

  // Regenerate refinement suggestions
  const handleRegenerateSuggestions = async () => {
    if (showContent && !generatedContent.fullContent) {
      toast.error('No proposal content available to generate suggestions from');
      return;
    }
    
    setLoadingSuggestions(true);
    setSelectedSuggestions([]);
    
    try {
      if (showContent) {
        // In refinement state - regenerate based on generated content
        await generateRefinementSuggestions(generatedContent.fullContent);
      } else {
        // In initial state - regenerate initial suggestions with variety
        const response = await proposalsAPI.getAll();
        const proposals = response.data.data || [];
        const recentContents = proposals
          .slice(0, 3)
          .map((p: any) => p.content?.executiveSummary || p.content || p.title || '')
          .filter(Boolean)
          .join('\n---\n');
        
        // Create different prompt variations to get variety
        const promptVariations = [
          {
            role: 'system',
            content: `You are an expert proposal consultant. Suggest 4-6 actionable ways to improve proposals. Each suggestion should be short and specific.`,
          },
          {
            role: 'system',
            content: `You are a creative proposal strategist. Suggest 4-6 unique ways to enhance proposals. Think outside the box.`,
          },
          {
            role: 'system',
            content: `You are a proposal optimization expert. Suggest 4-6 specific improvements for proposals. Focus on overlooked areas.`,
          }
        ];
        
        // Randomly select a prompt variation
        const randomPrompt = promptVariations[Math.floor(Math.random() * promptVariations.length)];
        
        if (recentContents) {
          const messages = [
            randomPrompt,
            {
              role: 'user',
              content: `Recent Proposals:\n${recentContents}\n\nWhat are some ways to refine or advance future proposals?`,
            },
          ];
          const aiResponse = await getOpenRouterChatCompletion(messages);
          const aiContent = aiResponse.choices[0]?.message?.content || '';
          const lines = aiContent.split('\n').filter((line: string) => line.trim());
          const aiSuggestions = lines
            .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
            .filter((suggestion: string) => suggestion.length > 10 && suggestion.length < 200)
            .slice(0, 6);
          
          // If we got suggestions, use them; otherwise use fallback
          if (aiSuggestions.length > 0) {
            setSuggestions(aiSuggestions);
          } else {
            // Use different fallback suggestions each time
            const fallbackVariations = [
              [
                'Add a competitive analysis section.',
                'Include a risk mitigation strategy.',
                'Suggest a phased rollout plan.',
                'Expand on the project timeline with milestones.',
                'Clarify the deliverables and success metrics.',
                'Add a section on post-launch support.'
              ],
              [
                'Include a technology stack overview.',
                'Add a team structure and roles section.',
                'Provide detailed cost breakdown.',
                'Include quality assurance processes.',
                'Add a communication plan.',
                'Include a change management strategy.'
              ],
              [
                'Add a market analysis section.',
                'Include performance metrics and KPIs.',
                'Provide alternative solutions.',
                'Add a resource allocation plan.',
                'Include a contingency plan.',
                'Add a stakeholder management section.'
              ]
            ];
            const randomFallback = fallbackVariations[Math.floor(Math.random() * fallbackVariations.length)];
            setSuggestions(randomFallback);
          }
        } else {
          // Use different fallback suggestions when no recent proposals exist
          const fallbackVariations = [
            [
              'Add a competitive analysis section.',
              'Include a risk mitigation strategy.',
              'Suggest a phased rollout plan.',
              'Expand on the project timeline with milestones.',
              'Clarify the deliverables and success metrics.',
              'Add a section on post-launch support.'
            ],
            [
              'Include a technology stack overview.',
              'Add a team structure and roles section.',
              'Provide detailed cost breakdown.',
              'Include quality assurance processes.',
              'Add a communication plan.',
              'Include a change management strategy.'
            ],
            [
              'Add a market analysis section.',
              'Include performance metrics and KPIs.',
              'Provide alternative solutions.',
              'Add a resource allocation plan.',
              'Include a contingency plan.',
              'Add a stakeholder management section.'
            ]
          ];
          const randomFallback = fallbackVariations[Math.floor(Math.random() * fallbackVariations.length)];
          setSuggestions(randomFallback);
        }
      }
    } catch (error) {
      console.error('Error regenerating suggestions:', error);
      
      // Handle specific OpenRouter credit limit error
      if (error instanceof Error && error.message.includes('OpenRouter credits exhausted')) {
        console.warn('OpenRouter credits exhausted, using fallback suggestions');
      }
      
      // Use different fallback suggestions on error
      const fallbackVariations = [
        [
          'Add a competitive analysis section.',
          'Include a risk mitigation strategy.',
          'Suggest a phased rollout plan.',
          'Expand on the project timeline with milestones.',
          'Clarify the deliverables and success metrics.',
          'Add a section on post-launch support.'
        ],
        [
          'Include a technology stack overview.',
          'Add a team structure and roles section.',
          'Provide detailed cost breakdown.',
          'Include quality assurance processes.',
          'Add a communication plan.',
          'Include a change management strategy.'
        ],
        [
          'Add a market analysis section.',
          'Include performance metrics and KPIs.',
          'Provide alternative solutions.',
          'Add a resource allocation plan.',
          'Include a contingency plan.',
          'Add a stakeholder management section.'
        ]
      ];
      const randomFallback = fallbackVariations[Math.floor(Math.random() * fallbackVariations.length)];
      setSuggestions(randomFallback);
    } finally {
      setLoadingSuggestions(false);
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

  // After proposal is generated, generate suggestions
  useEffect(() => {
    // If no content, fetch recent proposals and get AI suggestions
    if (!showContent) {
      (async () => {
        try {
          const response = await proposalsAPI.getAll();
          const proposals = response.data.data || [];
          const recentContents = proposals
            .slice(0, 3)
            .map((p: any) => p.content?.executiveSummary || p.content || p.title || '')
            .filter(Boolean)
            .join('\n---\n');
          if (recentContents) {
            setLoadingSuggestions(true);
            const messages = [
              {
                role: 'system',
                content: `You are an expert proposal consultant. Given the following recent proposals, suggest 4-6 actionable ways to improve or refine future proposals. Each suggestion should be a short, specific improvement or addition, such as adding a new section, clarifying a point, or proposing a next step. Suggestions should be relevant to the content and context of these proposals.`,
              },
              {
                role: 'user',
                content: `Recent Proposals:\n${recentContents}\n\nWhat are some ways to refine or advance future proposals?`,
              },
            ];
            const aiResponse = await getOpenRouterChatCompletion(messages);
            const aiContent = aiResponse.choices[0]?.message?.content || '';
            const lines = aiContent.split('\n').filter((line: string) => line.trim());
            const aiSuggestions = lines
              .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
              .filter((suggestion: string) => suggestion.length > 10 && suggestion.length < 200)
              .slice(0, 6);
            setSuggestions(aiSuggestions);
          } else {
            setSuggestions([
              'Add a competitive analysis section.',
              'Include a risk mitigation strategy.',
              'Suggest a phased rollout plan.',
              'Expand on the project timeline with milestones.',
              'Clarify the deliverables and success metrics.',
              'Add a section on post-launch support.'
            ]);
          }
        } catch (error) {
          setSuggestions([
            'Add a competitive analysis section.',
            'Include a risk mitigation strategy.',
            'Suggest a phased rollout plan.',
            'Expand on the project timeline with milestones.',
            'Clarify the deliverables and success metrics.',
            'Add a section on post-launch support.'
          ]);
        } finally {
          setLoadingSuggestions(false);
        }
      })();
    }
  }, [showContent]);

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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-8">
        {!showContent ? (
          // Single centered card when no content is generated
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-4xl bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-10 flex flex-col items-center justify-center min-h-[480px] mx-auto">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 text-center">AI Proposal Generator</h2>
              
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
                  placeholder={uploadedPdfContent ? "Add additional context or requirements (optional)..." : "Describe your client or project... or upload a PDF to generate a refined proposal"}
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

              {/* Suggestions under the text box */}
              <div className="w-full flex flex-wrap gap-2 justify-center mb-4 min-h-[60px]">
                {loadingSuggestions ? (
                  // Show placeholder suggestion bubbles during loading to maintain layout
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 rounded-full border border-gray-200 bg-gray-100 animate-pulse"
                      style={{ width: '180px', height: '40px' }}
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))
                ) : (
                  suggestions.slice(0, 6).map((s, i) => {
                    // Show more text in each bubble - limit to 8 words instead of 5
                    const words = s.replace(/^[*_\-\s]+|[*_\-\s]+$/g, '').split(' ');
                    const display = words.length > 8 ? words.slice(0, 8).join(' ') + '…' : s.replace(/^[*_\-\s]+|[*_\-\s]+$/g, '');
                    const isSelected = selectedSuggestions.includes(s);
                    const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                    return (
                      <button
                        key={i}
                        className={`px-4 py-2 rounded-full border transition max-w-[220px] font-medium text-sm ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : isDisabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-300'
                        }`}
                        onClick={() => handleSuggestionToggle(s)}
                        disabled={isDisabled}
                        title={s}
                      >
                        {display}
                      </button>
                    );
                  })
                )}
              </div>
              
              {/* Regenerate Suggestions button */}
              <div className="w-full flex justify-center mb-4">
                <button
                  onClick={handleRegenerateSuggestions}
                  disabled={loadingSuggestions}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate new refinement suggestions"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingSuggestions ? 'Generating...' : 'Regenerate Suggestions'}
                </button>
              </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

              {/* Suggestions */}
              <div className="w-full flex flex-wrap gap-2 mb-4 min-h-[40px]">
                {loadingSuggestions ? (
                  // Show placeholder suggestion bubbles during loading to maintain layout
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-100 animate-pulse"
                      style={{ width: '140px', height: '32px' }}
                    >
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))
                ) : (
                  suggestions.slice(0, 6).map((s, i) => {
                    const words = s.replace(/^[*_\-\s]+|[*_\-\s]+$/g, '').split(' ');
                    const display = words.length > 8 ? words.slice(0, 8).join(' ') + '…' : s.replace(/^[*_\-\s]+|[*_\-\s]+$/g, '');
                    const isSelected = selectedSuggestions.includes(s);
                    const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                    return (
                      <button
                        key={i}
                        className={`px-3 py-1.5 rounded-full border transition max-w-[180px] font-medium text-xs ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : isDisabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-300'
                        }`}
                        onClick={() => handleSuggestionToggle(s)}
                        disabled={isDisabled}
                        title={s}
                      >
                        {display}
                      </button>
                    );
                  })
                )}
              </div>
              
              {/* Regenerate Suggestions button */}
              <div className="w-full flex justify-center mb-4">
                <button
                  onClick={handleRegenerateSuggestions}
                  disabled={loadingSuggestions}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate new refinement suggestions"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingSuggestions ? 'Generating...' : 'Regenerate Suggestions'}
                </button>
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