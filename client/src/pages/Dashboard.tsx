import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  PaperAirplaneIcon,
  EnvelopeIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { generateProposalSuggestions } from '../services/aiService';
import { sendProposalEmail } from '../services/emailService';
import { getOpenRouterChatCompletion } from '../services/api';

interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface EmailData {
  to: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
}

export default function Dashboard() {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState<EmailData>({
    to: '',
    clientName: '',
    clientEmail: '',
    subject: '',
    message: ''
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [editableContent, setEditableContent] = useState('');

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const newSuggestions = await generateProposalSuggestions();
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      toast.success('PDF file selected successfully!');
    } else if (file) {
      toast.error('Please select a PDF file');
    }
  };

  const handleGenerateWithAI = async () => {
    if (!selectedFile && !inputText.trim()) {
      toast.error('Please enter some text or upload a PDF file');
      return;
    }

    setLoading(true);
    console.log('🚀 Dashboard AI generation started!');
    
    try {
      console.log('📝 Input text:', inputText);
      console.log('📄 Selected file:', selectedFile?.name);
      
      // Create the AI prompt based on input
      const prompt = inputText.trim() || 'Generate a professional business proposal';
      
      const messages = [
        {
          role: 'system',
          content: 'You are an expert business proposal writer with 15+ years of experience. Write detailed, specific, and professional proposal content. Never use generic placeholder text like "Feature 1" or "Benefit 1". Always provide concrete, actionable content with specific details, industry insights, and persuasive language.'
        },
        {
          role: 'user',
          content: `Create a comprehensive business proposal based on this information: ${prompt}

Please include these sections:

# Executive Summary
[Compelling overview of the project and its value]

# Project Overview
[Detailed analysis of requirements and objectives]

# Our Approach & Methodology
[Step-by-step methodology and processes]

# Project Deliverables
Create a detailed list of specific deliverables with descriptions and timelines. Format as:
- **Deliverable Name**: Brief description. Timeline: X weeks/days

# Project Timeline
Create a detailed timeline with specific phases, dates, and milestones. Format exactly as:
1. **Phase Name** (YYYY-MM-DD)
   Description of what will be completed in this phase.

2. **Phase Name** (YYYY-MM-DD)
   Description of what will be completed in this phase.

3. **Phase Name** (YYYY-MM-DD)
   Description of what will be completed in this phase.

IMPORTANT: Each timeline item must be on a new line with the number, then the phase name in bold, then the date in parentheses, then the description on the next line.

# Investment & Pricing
[Pricing structure and payment terms]

# Why Choose Us
[Experience, expertise, and competitive advantages]

# Next Steps
[Clear action items and contact information]

IMPORTANT: 
- Write specific, detailed content for each section
- Do not use generic text like "Feature 1"
- Make it professional, compelling, and tailored to the project description
- Include realistic timelines and deliverables based on the project scope
- Use specific dates and milestones for the timeline section`
        }
      ];

      console.log('🌐 Sending request to OpenRouter...');
      const response = await getOpenRouterChatCompletion(messages);
      
      console.log('✅ AI response received:', response);
      
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const aiContent = response.choices[0].message.content;
        console.log('📝 AI generated content length:', aiContent.length);
        
        const cleanContent = (content: string) => {
          return content
            .replace(/```markdown/g, '')
            .replace(/```/g, '')
            .trim();
        };

        const cleanedContent = cleanContent(aiContent);
        console.log('🧹 Content cleaned and ready');
        
        setGeneratedContent(cleanedContent);
        setShowContent(true);
        toast.success('Proposal generated successfully!');
      } else {
        console.error('❌ Invalid response structure:', response);
        toast.error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('❌ Error generating content:', error);
      toast.error('Failed to generate proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (selectedSuggestions.includes(suggestion.id)) {
      setSelectedSuggestions(selectedSuggestions.filter(id => id !== suggestion.id));
    } else {
      setSelectedSuggestions([...selectedSuggestions, suggestion.id]);
    }
  };

  const handleSendEmail = async () => {
    try {
      await sendProposalEmail({
        to: emailData.clientEmail,
        clientName: emailData.clientName,
        clientEmail: emailData.clientEmail,
        subject: emailData.subject,
        message: emailData.message
      });
      toast.success('Email sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      toast.error('Failed to send email');
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedFile(null);
    setGeneratedContent('');
    setEditableContent('');
    setShowContent(false);
    setSelectedSuggestions([]);
    setPreviewMode(false);
  };

  const handleSaveAsDraft = async () => {
    const contentToSave = editableContent || generatedContent;
    if (!contentToSave.trim()) {
      toast.error('No content to save');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to save drafts');
        return;
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Draft Proposal',
          content: contentToSave,
          status: 'DRAFT'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      toast.success('Draft saved successfully!');
      
      // Optionally redirect to the draft or clear the form
      setShowContent(false);
      setGeneratedContent('');
      setEditableContent('');
      setInputText('');
      setSelectedFile(null);
      setSelectedSuggestions([]);
      setPreviewMode(false);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            Create your next winning proposal
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform your ideas into compelling proposals with AI-powered assistance
          </p>
        </div>

        {/* Input Area */}
        <div className="card-elevated p-6 mb-8 animate-fade-in-up">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 font-medium shadow-sm focus:shadow-md transition-all duration-200"
              placeholder="Describe your project, requirements, or ask ProposalAI to help you create a winning proposal..."
              rows={5}
            />
            
            {/* PDF Upload inside textbox */}
            <div className="absolute bottom-4 right-4">
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="p-3 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-primary-200">
                  <DocumentArrowUpIcon className="h-5 w-5 text-primary-600" />
                </div>
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            {selectedFile && (
              <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl flex items-center">
                <DocumentArrowUpIcon className="h-4 w-4 mr-2 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">{selectedFile.name}</span>
              </div>
            )}
          </div>

          {/* Suggestion Bubbles */}
          {suggestions.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                {suggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                      selectedSuggestions.includes(suggestion.id)
                        ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-primary-300 shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {suggestion.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end mt-6">
            <button
              onClick={handleGenerateWithAI}
              disabled={(!selectedFile && !inputText.trim()) || loading}
              className="btn-primary flex items-center space-x-3 px-8 py-3 text-base font-semibold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Content Display */}
        {showContent && (
          <div className="card-elevated p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generated Proposal</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="btn-secondary flex items-center gap-2"
                >
                  {previewMode ? <PencilIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  {previewMode ? 'Edit Mode' : 'Preview Mode'}
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-600">AI Generated</span>
                </div>
              </div>
            </div>
            {previewMode ? (
              <div className="prose prose-base max-w-none text-gray-700 mb-6 leading-relaxed">
                <div className="proposal-content">
                  <ReactMarkdown>{editableContent || generatedContent}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <textarea
                  value={editableContent || generatedContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows={25}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200 bg-gray-50 font-mono text-sm leading-relaxed hover:bg-white"
                  placeholder="Edit your proposal content here..."
                />
              </div>
            )}
            <div className="flex gap-4">
              <button 
                onClick={handleSaveAsDraft}
                className="btn-primary flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save as Draft</span>
              </button>
              <button 
                onClick={() => setShowEmailModal(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <EnvelopeIcon className="h-5 w-5" />
                <span>Send Email</span>
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Proposal Email</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={emailData.clientName}
                  onChange={(e) => setEmailData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email *
                </label>
                <input
                  type="email"
                  value={emailData.clientEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Enter your message"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1"
              >
                <PaperAirplaneIcon className="h-4 w-4 inline mr-1" />
                Send Email
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900">Generating proposal...</span>
          </div>
        </div>
      )}
    </div>
  );
} 