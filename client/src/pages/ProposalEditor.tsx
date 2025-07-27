import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { proposalsAPI, getOpenRouterChatCompletion } from '../services/api';
import ClientSelectionModal from '../components/ClientSelectionModal';
import { 
  DocumentTextIcon, 
  UserIcon, 
  SparklesIcon, 
  CogIcon, 
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  LightBulbIcon,
  ChartBarIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon
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
  const [previewMode, setPreviewMode] = useState(false);

  const isNewProposal = !id;

  // Debug log to verify access requests
  console.log('🔍 Access requests state:', accessRequests);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const { data } = await proposalsAPI.getById(id!);
        // Ensure metadata exists with default values
        const proposalData = {
          ...data.data,
          metadata: {
            industry: '',
            companySize: '',
            projectScope: '',
            ...data.data.metadata
          },
          content: {
            executiveSummary: '',
            approach: '',
            budgetDetails: '',
            timeline: '',
            budget: '',
            fullProposal: '',
            ...data.data.content
          }
        };
        setProposal(proposalData);
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
    console.log('🚀 handleGenerateWithAI function called!');
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_OPENROUTER_API_KEY: process.env.REACT_APP_OPENROUTER_API_KEY ? 'SET' : 'NOT SET'
    });
    
    // Simple test to see if the function is working
    console.log('🧪 Simple test - function is working!');
    
    // Test with a simple prompt first to see if the AI is working
    console.log('🧪 Testing AI with simple prompt...');
    try {
      const testMessages = [
        {
          role: 'system',
          content: 'You are a helpful assistant that writes detailed, specific content.'
        },
        {
          role: 'user',
          content: 'Write a short paragraph about web development services. Be specific and detailed, not generic.'
        }
      ];
      
      const testResponse = await getOpenRouterChatCompletion(testMessages);
      console.log('🧪 Test response:', testResponse);
    } catch (error) {
      console.error('🧪 Test failed:', error);
    }

    // Validate required fields
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

    setGenerating(true);
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are an expert business proposal writer. Write detailed, specific content based on the project information provided. Never use generic placeholder text like "Feature 1" or "Benefit 1". Always provide concrete, actionable content.'
        },
        {
          role: 'user',
          content: `Write a professional business proposal for this project:

Client: ${proposal.clientName}
Project: ${proposal.description}
Budget: ${proposal.budget || 'To be determined'}
Timeline: ${proposal.timeline || 'To be determined'}

Create a detailed proposal with these sections:

# Executive Summary
[Write a compelling overview of the project and its value]

# Project Overview  
[Detailed analysis of requirements and objectives]

# Our Approach
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

# Investment
[Pricing and payment terms]

# Why Choose Us
[Experience and competitive advantages]

# Next Steps
[Clear action items and contact info]

IMPORTANT: 
- Write specific, detailed content for each section based on the project description
- Do not use generic text like "Feature 1"
- Make it professional and compelling
- Include realistic timelines and deliverables based on the project scope
- Use specific dates and milestones for the timeline section`
        }
      ];

      console.log('🚀 Sending AI generation request with messages:', messages);
      console.log('🔗 About to call getOpenRouterChatCompletion...');
      
      const response = await getOpenRouterChatCompletion(messages);
      
      console.log('✅ AI response received:', response);
      
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const aiContent = response.choices[0].message.content;
        console.log('📝 AI generated content:', aiContent);
        
        const cleanContent = (content: string) => {
          // Remove any markdown formatting that might interfere
          return content
            .replace(/```markdown/g, '')
            .replace(/```/g, '')
            .trim();
        };

        const cleanedContent = cleanContent(aiContent);
        console.log('🧹 Cleaned content:', cleanedContent);
        
        setProposal((prev: any) => ({
          ...prev,
          content: {
            ...prev.content,
            fullProposal: cleanedContent
          }
        }));
        
        toast.success('Proposal content generated successfully!');
      } else {
        console.error('❌ Invalid response structure:', response);
        toast.error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!proposal.title || !proposal.clientName || !proposal.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isNewProposal) {
        await proposalsAPI.create(proposal);
        toast.success('Proposal saved as draft!');
        navigate('/drafts');
      } else {
        await proposalsAPI.update(id, proposal);
        toast.success('Proposal updated successfully!');
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!proposal.title || !proposal.clientName || !proposal.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const updatedProposal = { ...proposal, status: 'SENT' };
      if (isNewProposal) {
        await proposalsAPI.create(updatedProposal);
      } else {
        await proposalsAPI.update(id, updatedProposal);
      }
      toast.success('Proposal submitted successfully!');
      navigate('/sent-proposals');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast.error('Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: any) => {
    setProposal((prev: any) => ({
      ...prev,
      clientName: client.name,
      clientEmail: client.email
    }));
    setSelectedClientId(client.id);
    setShowClientModal(false);
  };

  const handleClearClient = () => {
    setProposal((prev: any) => ({
      ...prev,
      clientName: '',
      clientEmail: ''
    }));
    setSelectedClientId(undefined);
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

  const handleRefineEntireProposal = async () => {
    if (!proposal?.content?.fullProposal) {
      toast.error('No content to refine. Please generate or add content first.');
      return;
    }

    setGenerating(true);
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert proposal writer with 15+ years of experience in refining and improving business proposals. Your expertise includes:

- Enhancing clarity and professional tone
- Strengthening value propositions and benefits
- Improving persuasive language and calls-to-action
- Adding specific details and concrete examples
- Ensuring industry-specific terminology and best practices
- Maintaining professional structure while improving content quality

When refining proposals, you focus on making the content more compelling, specific, and actionable while preserving the existing structure and key information.`
        },
        {
          role: 'user',
          content: `Please refine and improve the following proposal content. Make it more compelling, professional, and persuasive while maintaining the same structure and sections.

CURRENT PROPOSAL CONTENT:
${proposal.content.fullProposal}

Please enhance the following aspects:
1. Clarity and readability - Make the content easier to understand
2. Professional tone - Ensure it sounds authoritative and trustworthy
3. Persuasive language - Strengthen the value proposition and benefits
4. Specific details - Add concrete examples, metrics, and actionable items
5. Call-to-action - Make the next steps clear and compelling

IMPORTANT GUIDELINES:
- Maintain the existing structure and sections
- Keep all key information and client details
- Add specific, relevant details where appropriate
- Avoid generic placeholder text
- Make the content more engaging and professional
- Ensure each section provides clear value and next steps

Return the improved version with enhanced content while maintaining the same overall structure.`
        }
      ];

      const response = await getOpenRouterChatCompletion(messages);
      
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        setProposal((prev: any) => ({
          ...prev,
          content: {
            ...prev.content,
            fullProposal: response.choices[0].message.content.trim()
          }
        }));
        
        toast.success('Proposal refined successfully!');
      }
    } catch (error) {
      console.error('Error refining content:', error);
      toast.error('Failed to refine content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleFormatProposal = () => {
    if (!proposal?.content?.fullProposal) {
      toast.error('No content to format. Please add content first.');
      return;
    }

    const content = proposal.content.fullProposal;
    const formattedContent = content
      .replace(/([A-Z][a-z]+:)/g, '\n## $1') // Add markdown headers
      .replace(/(\d+\.\s)/g, '\n$1') // Add line breaks before numbered lists
      .replace(/(•\s)/g, '\n$1') // Add line breaks before bullet points
      .trim();

    setProposal((prev: any) => ({
      ...prev,
      content: {
        ...prev.content,
        fullProposal: formattedContent
      }
    }));

    toast.success('Proposal formatted successfully!');
  };

  const getCombinedProposalContent = () => {
    const sections = [];
    if (proposal?.content?.executiveSummary) sections.push(`# Executive Summary\n${proposal.content.executiveSummary}`);
    if (proposal?.content?.approach) sections.push(`# Approach\n${proposal.content.approach}`);
    if (proposal?.content?.budgetDetails) sections.push(`# Budget Details\n${proposal.content.budgetDetails}`);
    if (proposal?.content?.timeline) sections.push(`# Timeline\n${proposal.content.timeline}`);
    return sections.join('\n\n');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <DocumentTextIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewProposal ? 'Create New Proposal' : 'Edit Proposal'}
              </h1>
              <p className="text-sm text-gray-600">
                {isNewProposal ? 'Build a compelling proposal from scratch' : 'Refine and perfect your proposal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Submit Proposal
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <CogIcon className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Proposal Details</h2>
              </div>

              <form className="space-y-6">
                {/* Proposal Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Proposal Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proposal?.title || ''}
                    onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Enter proposal title"
                  />
                </div>

                {/* Client Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={proposal?.clientName || ''}
                        onChange={(e) => setProposal({ ...proposal, clientName: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                        placeholder="Enter client name"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClientModal(true)}
                        className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap font-medium ${
                          selectedClientId 
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' 
                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                        }`}
                      >
                        <UserIcon className="w-4 h-4" />
                        {selectedClientId ? 'Change' : 'Select'}
                      </button>
                    </div>
                    
                    {selectedClientId && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <CheckCircleIcon className="w-4 h-4" />
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
                </div>

                {/* Project Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={proposal?.description || ''}
                    onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                    placeholder="Describe the project, requirements, and objectives..."
                  />
                </div>

                {/* Budget & Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Budget
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={proposal?.budget || ''}
                        onChange={(e) => setProposal({ ...proposal, budget: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                        placeholder="e.g. $50,000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Timeline
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={proposal?.timeline || ''}
                        onChange={(e) => setProposal({ ...proposal, timeline: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                        placeholder="e.g. 2 months"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Generation Button */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔘 Button clicked!');
                    console.log('📊 Current state:', {
                      generating,
                      loading,
                      clientName: proposal?.clientName,
                      description: proposal?.description,
                      isDisabled: generating || loading || !proposal?.clientName || !proposal?.description
                    });
                    handleGenerateWithAI();
                  }}
                  disabled={generating || loading || !proposal?.clientName || !proposal?.description}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg ${
                    generating || loading || !proposal?.clientName || !proposal?.description
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 focus:ring-primary-500'
                  }`}
                >
                  {generating ? (
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Generating Content...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Generate AI Content
                    </div>
                  )}
                </button>
                
                {(!proposal?.clientName || !proposal?.description) && (
                  <p className="text-sm text-gray-500 text-center">
                    Enter client name and description to enable AI generation
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Right Panel - Content Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Proposal Content</h2>
                  <p className="text-gray-600">Review, edit, and refine your proposal content</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    {previewMode ? <PencilIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    {previewMode ? 'Edit Mode' : 'Preview Mode'}
                  </button>
                  <button
                    onClick={() => handleRefineEntireProposal()}
                    disabled={generating || !proposal?.content?.fullProposal}
                    className="btn-primary flex items-center gap-2"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    Refine with AI
                  </button>
                  <button 
                    onClick={() => handleFormatProposal()}
                    disabled={!proposal?.content?.fullProposal}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <CogIcon className="w-4 h-4" />
                    Format
                  </button>
                </div>
              </div>

              {/* Content Editor */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="w-4 h-4" />
                    Edit the entire proposal content below
                  </div>
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    Use "Refine with AI" to improve the entire document
                  </div>
                </div>

                {previewMode ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white min-h-[600px] overflow-y-auto">
                    <div className="proposal-content">
                      <ReactMarkdown>{proposal?.content?.fullProposal || getCombinedProposalContent()}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={proposal?.content?.fullProposal || getCombinedProposalContent()}
                    onChange={(e) => setProposal({ 
                      ...proposal, 
                      content: { 
                        ...proposal?.content, 
                        fullProposal: e.target.value 
                      } 
                    })}
                    rows={25}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200 bg-gray-50 font-mono text-sm leading-relaxed hover:bg-white"
                    placeholder="Enter your complete proposal content here...

# Executive Summary
[Your executive summary goes here]

# Project Overview
[Detailed analysis of requirements and objectives]

# Our Approach
[Step-by-step methodology and processes]

# Project Deliverables
- **Deliverable Name**: Brief description. Timeline: X weeks/days

# Project Timeline
1. **Phase Name** (YYYY-MM-DD)
   Description of what will be completed in this phase.

# Investment
[Pricing and payment terms]

# Why Choose Us
[Experience and competitive advantages]

# Next Steps
[Clear action items and contact info]"
                  />
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                  <span>Word count: {proposal?.content?.fullProposal?.split(/\s+/).length || 0} words</span>
                  <span>Characters: {proposal?.content?.fullProposal?.length || 0}</span>
                </div>
              </div>

              {/* Success Message */}
              {proposal?.content?.fullProposal && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">Content Ready!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Review and edit the content above. Use "Refine with AI" to improve the entire document or "Format" to structure it properly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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