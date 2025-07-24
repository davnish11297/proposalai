import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { proposalsAPI, getOpenRouterChatCompletion } from '../services/api';
import ClientSelectionModal from '../components/ClientSelectionModal';
import NotificationBell from '../components/NotificationBell';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  PaperAirplaneIcon, 
  UsersIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';

const ProposalEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
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
      budget: '',
      fullProposal: '' // Added for unified editing
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

  // Debug log to verify access requests
  console.log('🔍 Access requests state:', accessRequests);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRefineEntireProposal = async () => {
    try {
      setGenerating(true);
      const messages = [
        {
          role: 'system',
          content: `You are an expert proposal writer. Refine the entire proposal content. Make it more detailed, persuasive, and comprehensive.`,
        },
        {
          role: 'user',
          content: `Current Proposal Content:\n\n${proposal.content.fullProposal || getCombinedProposalContent()}`,
        },
      ];
      const result = await getOpenRouterChatCompletion(messages);
      const refinedContent = result.choices?.[0]?.message?.content || '';
      setProposal({
        ...proposal,
        content: {
          ...proposal.content,
          fullProposal: refinedContent,
        },
      });
      toast.success('Entire proposal refined successfully!');
    } catch (error: any) {
      console.error('❌ Refine entire proposal error:', error);
      toast.error(error.message || 'Failed to refine entire proposal');
    } finally {
      setGenerating(false);
    }
  };

  const handleFormatProposal = () => {
    const content = proposal.content.fullProposal || getCombinedProposalContent();
    let formattedContent = '';

    // Split content into sections
    const sections = content.split(/^(#+)\s*(.*)$/m);
    let i = 0;
    while (i < sections.length) {
      const level = sections[i].match(/^#+/)?.[0].length || 0;
      const title = sections[i + 1];
      const text = sections[i + 2];

      if (level === 1) {
        formattedContent += `# ${title}\n\n${text}\n\n`;
      } else if (level === 2) {
        formattedContent += `## ${title}\n\n${text}\n\n`;
      } else if (level === 3) {
        formattedContent += `### ${title}\n\n${text}\n\n`;
      } else {
        formattedContent += `${text}\n\n`; // For paragraphs or other text
      }
      i += 3; // Move to the next section
    }

    setProposal({
      ...proposal,
      content: {
        ...proposal.content,
        fullProposal: formattedContent.trim(),
      },
    });
    toast.success('Proposal content formatted!');
  };

  const getCombinedProposalContent = () => {
    return `${proposal.content.executiveSummary || ''}\n\n# Approach\n\n${proposal.content.approach || ''}\n\n# Budget Details\n\n${proposal.content.budgetDetails || ''}\n\n# Timeline\n\n${proposal.content.timeline || ''}\n\n# Additional Sections\n\n${proposal.content.additionalSections || ''}`;
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
              <a href="/dashboard" className="flex items-center space-x-1 text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">
                <HomeIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="/drafts" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <DocumentTextIcon className="w-5 h-5" />
                <span>Drafts</span>
              </a>
              <a href="/sent-proposals" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>Sent Proposals</span>
              </a>
              <a href="/clients" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <UsersIcon className="w-5 h-5" />
                <span>Clients</span>
              </a>
              <a href="/profile" className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors">
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </a>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Proposal Content</h2>
            <p className="text-gray-600">Review, edit, and refine your proposal content</p>
          </div>
          
          {/* Access Requests Section */}
          {(accessRequests.length > 0 || isNewProposal) && (
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Access Requests ({accessRequests.length > 0 ? accessRequests.length : 1})
              </h3>
              <div className="space-y-4">
                {accessRequests.length > 0 ? (
                  accessRequests.map((req) => (
                    <div key={req.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900">{req.name} ({req.email})</div>
                          <div className="text-sm text-gray-700">{req.company}</div>
                          <div className="text-xs text-gray-500 mt-1">{req.reason}</div>
                          <div className="text-xs text-gray-400 mt-1">Requested: {new Date(req.createdAt).toLocaleString()}</div>
                          {req.status === 'GRANTED' && req.accessCode && (
                            <div className="text-green-700 text-xs mt-1 font-medium">Access Code: {req.accessCode}</div>
                          )}
                        </div>
                        <div className="ml-4">
                          {req.status === 'PENDING' && (
                            <button
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-600 transition disabled:opacity-50 text-sm"
                              disabled={grantingRequestId === req.id}
                              onClick={() => handleGrantAccess(req.id)}
                            >
                              {grantingRequestId === req.id ? 'Granting...' : 'Grant Access'}
                            </button>
                          )}
                          {req.status === 'GRANTED' && (
                            <span className="text-green-600 font-semibold text-sm">✓ Granted</span>
                          )}
                          {req.status === 'DENIED' && (
                            <span className="text-red-600 font-semibold text-sm">✗ Denied</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg font-medium mb-2">No Access Requests</div>
                    <div className="text-sm">When clients request access to this proposal, they will appear here.</div>
                  </div>
                )}
              </div>
            </div>
          )}

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
              ) : (
                <div className="space-y-6">
                  {/* Single Unified Proposal Editor */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Proposal Content Editor
                      </h3>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleRefineEntireProposal()}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Refine with AI
                        </button>
                        <button 
                          onClick={() => handleFormatProposal()}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          Format
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Edit the entire proposal content below
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Use "Refine with AI" to improve the entire document
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={proposal.content.fullProposal || getCombinedProposalContent()}
                      onChange={(e) => setProposal({ 
                        ...proposal, 
                        content: { 
                          ...proposal.content, 
                          fullProposal: e.target.value 
                        } 
                      })}
                      rows={25}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-gray-50 font-mono text-sm leading-relaxed"
                      placeholder="Enter your complete proposal content here...

# Executive Summary
[Your executive summary goes here]

# Approach
[Your approach and methodology]

# Budget Details
[Detailed budget breakdown]

# Timeline
[Project timeline and milestones]

# Additional Sections
[Any other relevant sections]"
                    />
                    
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>Word count: {proposal.content.fullProposal?.split(/\s+/).length || 0} words</span>
                      <span>Characters: {proposal.content.fullProposal?.length || 0}</span>
                    </div>
                  </div>

                  {/* Success Message */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Content Generated Successfully!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">Review and edit the content above. Use "Refine with AI" to improve the entire document or "Format" to structure it properly.</p>
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