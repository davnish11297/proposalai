import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { proposalsAPI, getOpenRouterChatCompletion } from '../services/api';
import ClientSelectionModal from '../components/ClientSelectionModal';
import NotificationBell from '../components/NotificationBell';
import ReactMarkdown from 'react-markdown';

const ProposalEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [proposal, setProposal] = useState<any>({
    title: '',
    description: '',
    clientName: '',
    clientEmail: '',
    type: 'PROPOSAL',
    content: {
      executiveSummary: '',
      approach: '',
      budgetDetails: '',
      timeline: '',
      budget: ''
    },
    metadata: {
      industry: '',
      companySize: '',
      projectScope: ''
    }
  });
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [grantingRequestId, setGrantingRequestId] = useState<string | null>(null);

  const isNewProposal = !id;

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const { data } = await proposalsAPI.getById(id!);
        setProposal(data.data);
        setSelectedClientId(data.data.clientId);
      } catch (error) {
        console.error('Failed to fetch proposal:', error);
        toast.error('Failed to load proposal');
      }
    };

    if (id) {
      fetchProposal();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      proposalsAPI.getAccessRequests(id)
        .then(({ data }) => setAccessRequests(data.data))
        .catch(() => setAccessRequests([]));
    }
  }, [id]);

  const handleGenerateWithAI = async () => {
    // Validate required fields
    console.log('🔍 Current proposal state:', {
      clientName: proposal.clientName,
      description: proposal.description,
      hasClientName: !!proposal.clientName,
      hasDescription: !!proposal.description
    });
    
    if (!proposal.clientName || !proposal.description) {
      const missingFields = [];
      if (!proposal.clientName) missingFields.push('Client Name');
      if (!proposal.description) missingFields.push('Description');
      toast.error(`Please fill in: ${missingFields.join(' and ')} before generating content`);
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
          content: `Client Name: ${proposal.clientName}\nIndustry: ${proposal.metadata?.industry || ''}\nCompany Size: ${proposal.metadata?.companySize || ''}\nProject Description: ${proposal.description}\nBudget: ${proposal.content?.budget || ''}\nTimeline: ${proposal.content?.timeline || ''}\n\nPlease provide a professional proposal with the following sections:\n1. Executive Summary\n2. Approach\n3. Budget Details\n4. Timeline`,
        },
      ];
      
      console.log('🚀 Sending AI generation request with messages:', messages);
      
      const result = await getOpenRouterChatCompletion(messages);
      console.log('✅ AI response received:', result);
      
      const aiContent = result.choices?.[0]?.message?.content || '';
      console.log('📝 AI generated content:', aiContent);
      
      // Parse the AI response into sections
      console.log('�� Raw AI response:', aiContent);
      
      // Improved parsing with better regex patterns
      let executiveSummary = '', approach = '', budgetDetails = '', timeline = '';
      
      // More flexible regex patterns that handle various formats
      const execMatch = aiContent.match(/(?:Executive Summary|EXECUTIVE SUMMARY)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Approach|APPROACH|Budget|BUDGET|Timeline|TIMELINE|Next Steps|NEXT STEPS)[:\s\n]|$)/i);
      const approachMatch = aiContent.match(/(?:Approach|APPROACH|Methodology|METHODOLOGY)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Budget|BUDGET|Timeline|TIMELINE|Next Steps|NEXT STEPS)[:\s\n]|$)/i);
      const budgetMatch = aiContent.match(/(?:Budget Details?|BUDGET DETAILS?|Budget|BUDGET)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Timeline|TIMELINE|Next Steps|NEXT STEPS)[:\s\n]|$)/i);
      const timelineMatch = aiContent.match(/(?:Timeline|TIMELINE|Schedule|SCHEDULE)[:\s\n]*([\s\S]*?)(?=\n\s*(?:Next Steps|NEXT STEPS|Conclusion|CONCLUSION)[:\s\n]|$)/i);
      
      executiveSummary = execMatch?.[1]?.trim() || '';
      approach = approachMatch?.[1]?.trim() || '';
      budgetDetails = budgetMatch?.[1]?.trim() || '';
      timeline = timelineMatch?.[1]?.trim() || '';
      
      // If regex parsing didn't work well, try alternative parsing
      if (!executiveSummary && !approach && !budgetDetails && !timeline) {
        console.log('⚠️ Primary regex parsing failed, trying alternative parsing');
        
        // Split by numbered sections or headers
        const sections = aiContent.split(/\n\s*(?:\d+\.\s*)?(?:Executive Summary|Approach|Budget|Timeline|Methodology|Schedule)/i);
        
        if (sections.length > 1) {
          executiveSummary = sections[1]?.trim() || '';
          approach = sections[2]?.trim() || '';
          budgetDetails = sections[3]?.trim() || '';
          timeline = sections[4]?.trim() || '';
        } else {
          // Last resort: use the full content as executive summary
          console.log('⚠️ Alternative parsing failed, using full content as executive summary');
          executiveSummary = aiContent;
        }
      }
      
      // Clean up the content by removing extra whitespace and formatting
      const cleanContent = (content: string) => {
        return content
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
          .replace(/^\s+|\s+$/g, '') // Trim whitespace
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
          .replace(/\*(.*?)\*/g, '$1'); // Remove italic formatting
      };
      
      executiveSummary = cleanContent(executiveSummary);
      approach = cleanContent(approach);
      budgetDetails = cleanContent(budgetDetails);
      timeline = cleanContent(timeline);
      
      console.log('📋 Parsed sections:', {
        executiveSummary: executiveSummary.substring(0, 150) + (executiveSummary.length > 150 ? '...' : ''),
        approach: approach.substring(0, 150) + (approach.length > 150 ? '...' : ''),
        budgetDetails: budgetDetails.substring(0, 150) + (budgetDetails.length > 150 ? '...' : ''),
        timeline: timeline.substring(0, 150) + (timeline.length > 150 ? '...' : '')
      });
      
      setProposal({
        ...proposal,
        content: {
          ...proposal.content,
          executiveSummary,
          approach,
          budgetDetails,
          timeline,
        },
      });
      
      toast.success('Proposal content generated successfully!');
    } catch (error: any) {
      console.error('❌ Content generation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast.error(error.message || 'Failed to generate proposal content');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const proposalData = {
        ...proposal,
        // teamId: selectedTeamId, // teamId is not used
      };
      
      if (isNewProposal) {
        // Create new proposal
        await proposalsAPI.create(proposalData);
        toast.success('Proposal created successfully!');
        navigate('/proposals');
      } else {
        // Update existing proposal
        await proposalsAPI.update(id!, proposalData);
        toast.success('Proposal updated successfully!');
      }
      
      navigate('/proposals');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.error || 'Failed to save proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const proposalData = {
        ...proposal,
        // teamId: selectedTeamId, // teamId is not used
        status: 'IN_REVIEW'
      };
      
      if (isNewProposal) {
        // Create and submit new proposal
        await proposalsAPI.create(proposalData);
        toast.success('Proposal submitted successfully!');
        navigate('/proposals');
      } else {
        // Update and submit existing proposal
        await proposalsAPI.update(id!, proposalData);
        toast.success('Proposal submitted successfully!');
        navigate('/proposals');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: any) => {
    setProposal({
      ...proposal,
      clientName: client.name,
      clientEmail: client.email || '',
    });
    setSelectedClientId(client.id);
    toast.success(`Selected client: ${client.name}`);
  };

  const handleClearClient = () => {
    setProposal({
      ...proposal,
      clientName: '',
      clientEmail: '',
    });
    setSelectedClientId(undefined);
    toast.success('Client selection cleared');
  };

  const handleGrantAccess = async (requestId: string) => {
    setGrantingRequestId(requestId);
    try {
      await proposalsAPI.grantAccessRequest(id!, requestId);
      toast.success('Access granted and email sent!');
      // Refresh access requests
      const { data } = await proposalsAPI.getAccessRequests(id!);
      setAccessRequests(data.data);
    } catch (error) {
      toast.error('Failed to grant access');
    } finally {
      setGrantingRequestId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
      </div>
    );
  }

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
                onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
                className="text-white/80 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content Flex Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <aside className="w-[380px] min-w-[380px] max-w-[380px] bg-white border-r border-gray-200 flex flex-col p-8">
          {/* Access Requests UI (for owner) */}
          {accessRequests.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-2 text-blue-700">Access Requests</h3>
              <ul className="space-y-4">
                {accessRequests.map((req) => (
                  <li key={req.id} className="bg-blue-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-blue-100">
                    <div>
                      <div className="font-semibold text-blue-900">{req.name} ({req.email})</div>
                      <div className="text-sm text-gray-700">{req.company}</div>
                      <div className="text-xs text-gray-500">{req.reason}</div>
                      <div className="text-xs text-gray-400 mt-1">Requested: {new Date(req.createdAt).toLocaleString()}</div>
                      {req.status === 'GRANTED' && req.accessCode && (
                        <div className="text-green-700 text-xs mt-1">Granted: {req.accessCode}</div>
                      )}
                    </div>
                    {req.status === 'PENDING' && (
                      <button
                        className="mt-2 md:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-600 transition disabled:opacity-50"
                        disabled={grantingRequestId === req.id}
                        onClick={() => handleGrantAccess(req.id)}
                      >
                        {grantingRequestId === req.id ? 'Granting...' : 'Grant Access'}
                      </button>
                    )}
                    {req.status === 'GRANTED' && (
                      <span className="ml-2 text-green-600 font-semibold">Granted</span>
                    )}
                    {req.status === 'DENIED' && (
                      <span className="ml-2 text-red-600 font-semibold">Denied</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {isNewProposal ? 'Create New Proposal' : 'Edit Proposal'}
          </h2>
          <form className="space-y-8">
                              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Proposal Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proposal.title}
                    onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter proposal title"
                  />
                </div>
                              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={proposal.clientName}
                      onChange={(e) => setProposal({ ...proposal, clientName: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter client name"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap font-medium ${
                        selectedClientId 
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {selectedClientId ? 'Change' : 'Select'}
                    </button>
                  </div>
                {selectedClientId && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-green-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Client selected from database
                      </div>
                      <button
                        type="button"
                        onClick={handleClearClient}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
                              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={proposal.description}
                    onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                    placeholder="Describe the project, requirements, and objectives..."
                  />
                </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Budget</label>
                  <input
                    type="text"
                    value={proposal.content.budget}
                    onChange={(e) => setProposal({ ...proposal, content: { ...proposal.content, budget: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., $50,000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Timeline</label>
                  <input
                    type="text"
                    value={proposal.content.timeline}
                    onChange={(e) => setProposal({ ...proposal, content: { ...proposal.content, timeline: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., 3 months"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Industry</label>
                <input
                  type="text"
                  value={proposal.metadata.industry}
                  onChange={(e) => setProposal({ ...proposal, metadata: { ...proposal.metadata, industry: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                >
                  Submit Proposal
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={generating || loading || !proposal.clientName || !proposal.description}
                className={`w-full mt-8 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg ${
                  generating || loading || !proposal.clientName || !proposal.description
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500'
                }`}
              >
                {generating ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Content...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate AI Content
                  </div>
                )}
              </button>
              {(!proposal.clientName || !proposal.description) && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Enter client name and description to enable AI generation
                </p>
              )}
          </form>
        </aside>
        {/* Right Content Area */}
        <main className="flex-1 flex flex-col p-12 overflow-y-auto bg-gray-50">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Generated Content</h2>
            <p className="text-gray-600">Review and customize your AI-generated proposal content</p>
          </div>
          <div className="max-h-[700px] min-h-[300px] flex-1 overflow-y-auto pr-2">
              {generating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    {/* Animated circles */}
                    <div className="absolute inset-0 animate-ping">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
                    </div>
                    <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20"></div>
                    </div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Proposal</h3>
                    <p className="text-gray-600">Our AI is crafting a professional proposal tailored to your needs...</p>
                    
                    {/* Animated dots */}
                    <div className="flex justify-center mt-4 space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              ) : !proposal.content.executiveSummary && !proposal.content.approach && !proposal.content.budgetDetails && !proposal.content.timeline ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Generate</h3>
                  <p className="text-gray-600 mb-6 text-lg max-w-md">Fill in the required fields and click "Generate AI Content" to create your professional proposal</p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md">
                    <div className="flex items-center gap-3 text-blue-800 mb-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">AI will generate:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Executive Summary
                      </div>
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Approach
                      </div>
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Budget Details
                      </div>
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Timeline
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  {proposal.content.executiveSummary && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Executive Summary
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                        <ReactMarkdown>
                          {proposal.content.executiveSummary}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Approach */}
                  {proposal.content.approach && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                      <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Approach
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                        <ReactMarkdown>
                          {proposal.content.approach}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Budget Details */}
                  {proposal.content.budgetDetails && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Budget Details
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                        <ReactMarkdown>
                          {proposal.content.budgetDetails}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {proposal.content.timeline && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-100">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Timeline
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                        <ReactMarkdown>
                          {proposal.content.timeline}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Content Generated Successfully!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">Review the content above and make any necessary adjustments before saving.</p>
                  </div>
                </div>
              )}
            </div>
        </main>
      </div>
      
      {/* Client Selection Modal */}
      <ClientSelectionModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSelectClient={handleClientSelect}
        selectedClientId={selectedClientId}
      />
    </div>
  );
};

export default ProposalEditor; 