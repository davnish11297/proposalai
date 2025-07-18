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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);

  // Generate refinement suggestions based on the generated proposal
  const generateRefinementSuggestions = useCallback(async (proposal: string) => {
    setLoadingSuggestions(true);
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert proposal consultant. Given the following proposal, suggest 4-6 actionable ways to refine, expand, or advance it. Each suggestion should be a short, specific improvement or addition, such as adding a new section, clarifying a point, or proposing a next step. Suggestions should be relevant to the content and context of the proposal.`,
        },
        {
          role: 'user',
          content: `Proposal Content:\n${proposal}\n\nWhat are some ways to refine or advance this proposal?`,
        },
      ];
      const response = await getOpenRouterChatCompletion(messages);
      const aiContent = response.choices[0]?.message?.content || '';
      const lines = aiContent.split('\n').filter((line: string) => line.trim());
      const aiSuggestions = lines
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 10 && suggestion.length < 200)
        .slice(0, 6);
      setSuggestions(aiSuggestions);
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
  }, []);

  // When a suggestion bubble is clicked, refine the proposal or fill input
  const handleSuggestionClick = async (suggestion: string) => {
    if (!showContent) {
      setProposalText(suggestion);
      return;
    }
    if (generating) return;
    setGenerating(true);
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert proposal writer. Refine or expand the following proposal based on this suggestion: "${suggestion}". Return a full, improved proposal in markdown format.`,
        },
        {
          role: 'user',
          content: generatedContent.fullContent,
        },
      ];
      const response = await getOpenRouterChatCompletion(messages);
      const aiContent = response.choices[0]?.message?.content || '';
      setGeneratedContent({
        executiveSummary: '',
        approach: '',
        budgetDetails: '',
        timeline: '',
        fullContent: htmlToMarkdown(aiContent)
      });
      setTimeout(() => {
        setShowContent(true);
      }, 500);
      generateRefinementSuggestions(aiContent);
    } catch (error) {
      // handle error
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!proposalText.trim()) {
      toast.error('Please enter a proposal description before generating content');
      return;
    }
    try {
      setGenerating(true);
      // Compose prompt for OpenRouter
      const messages = [
        {
          role: 'system',
          content: `You are an expert proposal writer. Generate a detailed, professional proposal for the following client and project. Structure your response with clear sections: Executive Summary, Approach, Budget Details, and Timeline. Use clear, persuasive language and make each section comprehensive.`,
        },
        {
          role: 'user',
          content: `Project Description: ${proposalText}\n\nPlease provide a professional proposal with the following sections:\n1. Executive Summary\n2. Approach\n3. Budget Details\n4. Timeline`,
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
      toast.error('Failed to generate proposal content. Please try again.');
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Proposal Input Card */}
          <div className="col-span-2 bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col justify-between min-h-[340px]">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">AI Proposal Generator</h2>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition mb-4 bg-gray-50"
              placeholder="Describe your client or project..."
              value={proposalText}
              onChange={e => setProposalText(e.target.value)}
              disabled={generating}
            />
            <div className="flex gap-4 mt-2">
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition disabled:opacity-60"
                onClick={handleGenerateWithAI}
                disabled={generating || !proposalText.trim()}
              >
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold border border-gray-200 hover:bg-gray-200 transition"
                onClick={() => setProposalText('')}
                disabled={generating || !proposalText.trim()}
              >
                Clear
              </button>
            </div>
          </div>
          {/* Suggestions Card */}
          <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col min-h-[340px]">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Refinement Suggestions</h3>
            {loadingSuggestions ? (
              <div className="text-center text-gray-400">Loading suggestions...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium text-sm border border-blue-100 hover:bg-blue-100 transition"
                    onClick={() => handleSuggestionClick(s)}
                    disabled={generating}
                  >
                    {s.replace(/^[*_\-\s]+|[*_\-\s]+$/g, '')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Generated Proposal Card */}
        {showContent && (
          <div className="bg-white/90 rounded-2xl shadow-2xl border border-gray-100 p-10 mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Generated Proposal</h2>
            <div className="prose max-w-none text-gray-800 text-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent.fullContent}</ReactMarkdown>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition"
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                {savingDraft ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold shadow-md hover:bg-green-700 transition"
                onClick={() => setShowEmailModal(true)}
                disabled={sendingEmail}
              >
                {sendingEmail ? 'Sending...' : 'Send as Email'}
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold border border-gray-200 hover:bg-gray-200 transition"
                onClick={() => setDownloadingPdf(true)}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? 'Downloading...' : 'Download as PDF'}
              </button>
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