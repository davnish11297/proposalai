import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOpenRouterChatCompletion } from '../services/api';
import { proposalsAPI } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import BrowserNotificationPrompt from '../components/BrowserNotificationPrompt';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  PaperAirplaneIcon, 
  UsersIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import '../ProposalMarkdown.css';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadedPdfContent, setUploadedPdfContent] = useState<string>('');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Predefined suggestions for proposal enhancement
  const predefinedSuggestions = [
    {
      text: "Add Executive Summary",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>,
      color: 'blue' as const
    },
    {
      text: "Include Budget Details",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>,
      color: 'green' as const
    },
    {
      text: "Add Timeline Section",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      color: 'purple' as const
    },
    {
      text: "Highlight Key Benefits",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      color: 'orange' as const
    },
    {
      text: "Clarify Project Scope",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>,
      color: 'red' as const
    },
    {
      text: "Define Success Metrics",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      color: 'yellow' as const
    },
    {
      text: "Showcase Team Expertise",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>,
      color: 'blue' as const
    },
    {
      text: "Provide Case Studies",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>,
      color: 'green' as const
    }
  ];

  // Show notification prompt after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotificationPrompt(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      // Simulate PDF processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadedPdfContent('PDF content extracted successfully');
      toast.success('PDF uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : prev.length < 5 
          ? [...prev, suggestion]
          : prev
    );
  };

  const handleGenerateWithAI = async () => {
    if (!proposalText.trim() && !uploadedPdfContent.trim()) {
      toast.error('Please enter some content or upload a PDF');
      return;
    }

    setGenerating(true);
    try {
      const content = uploadedPdfContent || proposalText;
      const selectedSuggestionsText = selectedSuggestions.length > 0 
        ? `\n\nEnhancement requests: ${selectedSuggestions.join(', ')}`
        : '';
      
      const messages = [
        {
          role: 'system',
          content: 'You are an expert proposal writer. Create a comprehensive, professional business proposal based on the provided content. Include executive summary, approach, budget details, and timeline sections.'
        },
        {
          role: 'user',
          content: `Generate a professional proposal based on this content: ${content}${selectedSuggestionsText}`
        }
      ];

      const response = await getOpenRouterChatCompletion(messages);
      const generatedText = response.choices[0]?.message?.content || '';

      setGeneratedContent({
        executiveSummary: generatedText,
        approach: generatedText,
        budgetDetails: generatedText,
        timeline: generatedText,
        fullContent: generatedText
      });

      setShowContent(true);
      toast.success('Proposal generated successfully!');
    } catch (error) {
      toast.error('Failed to generate proposal content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await proposalsAPI.create({
        title: 'Draft Proposal',
        content: generatedContent.fullContent,
        status: 'DRAFT'
      });
      toast.success('Draft saved successfully!');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Proposal sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      // Simulate PDF download
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <span className="text-xl font-bold text-gray-900">ProposalAI</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-orange-600 font-medium flex items-center gap-2"
              >
                <HomeIcon className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/drafts')}
                className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Drafts
              </button>
              <button 
                onClick={() => navigate('/clients')}
                className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
              >
                <UsersIcon className="w-4 h-4" />
                Clients
              </button>
            </nav>
          </div>
          
          {/* Right side - User actions */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="relative">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
                <UserIcon className="w-5 h-5" />
                <span className="hidden md:block">Account</span>
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-8">
        <div className="w-full max-w-6xl">
          {!showContent ? (
            // Single centered card when no content is generated
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-10 flex flex-col items-center justify-center min-h-[480px] mx-auto">
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
                  className="w-full h-[180px] rounded-lg border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 resize-none font-normal"
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
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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

              {/* Suggestion Bubbles */}
              <div className="w-full mb-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {predefinedSuggestions.map((suggestion, index) => {
                    const isSelected = selectedSuggestions.includes(suggestion.text);
                    const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                    
                    const colorClasses = {
                      blue: isSelected ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                      green: isSelected ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                      purple: isSelected ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                      orange: isSelected ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                      red: isSelected ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                      yellow: isSelected ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    };
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !isDisabled && !generating && handleSuggestionClick(suggestion.text)}
                        disabled={generating || isDisabled}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                          generating || isDisabled 
                            ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200' 
                            : colorClasses[suggestion.color]
                        }`}
                      >
                        {suggestion.icon}
                        {suggestion.text}
                      </button>
                    );
                  })}
                </div>
                {selectedSuggestions.length > 0 && (
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-500">
                      {selectedSuggestions.length}/5 suggestions selected
                    </span>
                  </div>
                )}
              </div>

              {/* Generate and Clear buttons */}
              <div className="flex gap-4 mt-2 w-full justify-center">
                <button
                  className="px-6 py-2 rounded-lg bg-orange-600 text-white font-bold shadow-md hover:bg-orange-700 transition disabled:opacity-60"
                  onClick={handleGenerateWithAI}
                  disabled={generating || (!proposalText.trim() && !uploadedPdfContent.trim())}
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
                <button
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold shadow-md hover:bg-gray-300 transition"
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
          ) : (
            // Side-by-side layout when content is generated
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* Left side - Input and Refinement */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
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
                    className="w-full h-[180px] rounded-lg border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-gray-50 resize-none"
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
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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

                {/* Refinement Suggestions */}
                <div className="w-full mb-4">
                  <div className="flex flex-wrap gap-2">
                    {predefinedSuggestions.map((suggestion, index) => {
                      const isSelected = selectedSuggestions.includes(suggestion.text);
                      const isDisabled = !isSelected && selectedSuggestions.length >= 5;
                      
                      const colorClasses = {
                        blue: isSelected ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                        green: isSelected ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                        purple: isSelected ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                        orange: isSelected ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                        red: isSelected ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                        yellow: isSelected ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      };
                      
                      return (
                        <button
                          key={index}
                          onClick={() => !isDisabled && !generating && handleSuggestionClick(suggestion.text)}
                          disabled={generating || isDisabled}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                            generating || isDisabled 
                              ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200' 
                              : colorClasses[suggestion.color]
                          }`}
                        >
                          {suggestion.icon}
                          {suggestion.text}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSuggestions.length > 0 && (
                    <div className="text-center mt-2">
                      <span className="text-xs text-gray-500">
                        {selectedSuggestions.length}/5 suggestions selected
                      </span>
                    </div>
                  )}
                </div>

                {/* Refine and Clear buttons */}
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold shadow-md hover:bg-orange-700 transition disabled:opacity-60 flex-1"
                    onClick={async () => {
                      setGenerating(true);
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
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
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
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
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
        </div>
      </main>

      {/* Loading Screen */}
      {generating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full opacity-20"></div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold shadow hover:bg-orange-700 transition disabled:opacity-60"
                disabled={sendingEmail || !email.trim() || !clientName.trim()}
              >
                {sendingEmail ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Browser Notification Prompt */}
      <BrowserNotificationPrompt 
        showPrompt={showNotificationPrompt}
        onClose={() => setShowNotificationPrompt(false)}
        onPermissionGranted={() => {
          setShowNotificationPrompt(false);
          toast.success('Browser notifications enabled!');
        }}
        onPermissionDenied={() => {
          setShowNotificationPrompt(false);
          toast('You can enable notifications manually in your browser settings');
        }}
      />
    </div>
  );
};

export default Dashboard;