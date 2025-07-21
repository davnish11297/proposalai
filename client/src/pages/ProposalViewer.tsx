import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { proposalsAPI } from '../services/api';
import Comments from '../components/Comments';
import EmailTracking from '../components/EmailTracking';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowTrendingUpIcon,
  LightBulbIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { getOpenRouterChatCompletion } from '../services/api';

interface Proposal {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  status: string;
  type: string;
  content: any;
  metadata?: any;
  version: number;
  isPublic: boolean;
  publicUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    name: string;
    email: string;
  };
  comments: any[];
  activities: any[];
  _count: {
    comments: number;
    activities: number;
  };
}

const ProposalViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'activity' | 'analytics' | 'email-tracking'>('overview');
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [generatingAnalytics, setGeneratingAnalytics] = useState(false);
  const [hasVisitedAnalytics, setHasVisitedAnalytics] = useState(false);

  const fetchProposal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await proposalsAPI.getById(id!);
      if (response.data.success) {
        setProposal(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch proposal:', error);
      toast.error('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const generateAnalytics = useCallback(async () => {
    if (!proposal) return;

    try {
      setGeneratingAnalytics(true);
      
      // Prepare proposal content for analysis
      let contentText = '';
      if (typeof proposal.content === 'string') {
        contentText = proposal.content;
      } else if (typeof proposal.content === 'object' && proposal.content !== null) {
        contentText = Object.entries(proposal.content)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n\n');
      }

      const analysisPrompt = `Analyze this business proposal and provide detailed insights. Return ONLY a valid JSON object without any markdown formatting, code blocks, or additional text.

The JSON should include these exact fields:
{
  "proposalStrengthScore": number (0-100),
  "clientFitScore": number (0-100),
  "successProbability": number (0-100),
  "keyStrengths": ["string1", "string2", "string3"],
  "areasForImprovement": ["string1", "string2", "string3"],
  "riskAssessment": {
    "Risk Name": {"level": "Low/Medium/High", "explanation": "string"}
  },
  "roiPotential": {
    "Metric Name": "value"
  },
  "competitiveAnalysis": {
    "Aspect": "analysis"
  },
  "timelineFeasibility": {
    "Aspect": "assessment"
  }
}

Proposal Title: ${proposal.title}
Client: ${proposal.clientName}
Description: ${proposal.description || 'N/A'}
Content: ${contentText}

Return ONLY the JSON object, no other text.`;

      const response = await getOpenRouterChatCompletion([
        { role: 'user', content: analysisPrompt }
      ]);

      // Clean the response to extract pure JSON
      let responseContent = response.choices[0].message.content;
      
      // Remove markdown code blocks if present
      responseContent = responseContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Remove any leading/trailing whitespace
      responseContent = responseContent.trim();
      
      // Try to parse the cleaned JSON
      let analyticsData;
      try {
        analyticsData = JSON.parse(responseContent);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', responseContent);
        // Fallback: create a basic analytics structure
        analyticsData = {
          proposalStrengthScore: 75,
          clientFitScore: 70,
          successProbability: 65,
          keyStrengths: ['Professional presentation', 'Clear value proposition', 'Detailed approach'],
          areasForImprovement: ['Could include more specific metrics', 'Timeline could be more detailed', 'Budget breakdown could be clearer'],
          riskAssessment: {
            'Technical Risk': { level: 'Low', explanation: 'Standard implementation approach' },
            'Timeline Risk': { level: 'Medium', explanation: 'Aggressive timeline may need adjustment' },
            'Budget Risk': { level: 'Low', explanation: 'Reasonable cost structure' }
          },
          roiPotential: {
            'Expected ROI': '150-200%',
            'Payback Period': '12-18 months',
            'Value Proposition': 'Strong cost-benefit ratio'
          },
          competitiveAnalysis: {
            'Market Position': 'Competitive pricing with premium features',
            'Differentiators': 'AI-powered insights and modern technology stack',
            'Competitive Advantage': 'Comprehensive solution with ongoing support'
          },
          timelineFeasibility: {
            'Overall Feasibility': 'Realistic with proper resources',
            'Critical Path': 'Design and development phases',
            'Risk Mitigation': 'Phased approach with regular checkpoints'
          }
        };
        toast.error('Analytics generated with fallback data due to parsing error.');
      }
      
      setAnalytics(analyticsData);
      
      toast.success('Analytics generated successfully!');
    } catch (error) {
      console.error('Failed to generate analytics:', error);
      toast.error('Failed to generate analytics. Please try again.');
    } finally {
      setGeneratingAnalytics(false);
    }
  }, [proposal]);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id, fetchProposal]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'comments', 'activity', 'analytics', 'email-tracking'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Auto-generate analytics when first visiting the analytics tab
  useEffect(() => {
    if (activeTab === 'analytics' && !hasVisitedAnalytics && proposal && !analytics && !generatingAnalytics) {
      setHasVisitedAnalytics(true);
      generateAnalytics();
    }
  }, [activeTab, hasVisitedAnalytics, proposal, analytics, generatingAnalytics, generateAnalytics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WON': return '🏆';
      case 'LOST': return '❌';
      case 'IN_REVIEW': return '⏳';
      case 'SENT': return '📤';
      case 'DRAFT': return '📝';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBudgetDetails = (budgetDetails: any) => {
    if (!budgetDetails) return null;
    
    if (typeof budgetDetails === 'object' && budgetDetails.total) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Budget Breakdown</h4>
          <div className="text-2xl font-bold text-blue-600 mb-2">
            ${budgetDetails.total?.toLocaleString() || 'N/A'}
          </div>
          {budgetDetails.breakdown && (
            <div className="space-y-2">
              {Object.entries(budgetDetails.breakdown).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="font-medium">${value?.toLocaleString() || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <div className="text-gray-700">{JSON.stringify(budgetDetails)}</div>;
  };

  const renderContentSection = (title: string, content: any) => {
    if (!content) return null;
    
    // Handle budget details specially
    if (typeof content === 'object' && content.total && content.breakdown) {
      return renderBudgetDetails(content);
    }
    
    // Convert content to string for processing
    let displayContent = '';
    if (typeof content === 'string') {
      displayContent = content;
    } else if (typeof content === 'object' && content !== null) {
      displayContent = JSON.stringify(content, null, 2);
    } else {
      displayContent = String(content);
    }
    
    // Handle escaped characters
    displayContent = displayContent
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
    
    // Process markdown-like formatting
    const processContent = (text: string) => {
      return text
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
        
        // Tables - more robust parsing
        .replace(/(\|.*\|[\s\S]*?)(?=\n\n|\n[^|]|$)/g, (match) => {
          const lines = match.trim().split('\n').filter(line => line.trim());
          if (lines.length < 2) return match;
          
          const tableRows = lines.filter(line => line.includes('|'));
          if (tableRows.length < 2) return match;
          
          let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 bg-white">';
          
          tableRows.forEach((row, index) => {
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
            
            if (index === 0) {
              // Header row
              tableHtml += '<thead><tr class="bg-gray-50">';
              cells.forEach(cell => {
                tableHtml += `<th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">${cell}</th>`;
              });
              tableHtml += '</tr></thead><tbody>';
            } else if (index === 1 && cells.every(cell => /^[-:]+$/.test(cell))) {
              // Separator row - skip it
              return;
            } else {
              // Data row
              tableHtml += '<tr>';
              cells.forEach(cell => {
                tableHtml += `<td class="border border-gray-300 px-4 py-2 text-sm text-gray-700">${cell}</td>`;
              });
              tableHtml += '</tr>';
            }
          });
          
          tableHtml += '</tbody></table></div>';
          return tableHtml;
        })
        
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        
        // Italic text
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
        .replace(/_(.*?)_/g, '<em class="italic text-gray-800">$1</em>')
        
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto my-3">$1</pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>')
        
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
        
        // Lists
        .replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
        .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
        
        // Line breaks
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br>');
    };
    
    // Process the content
    const processedContent = processContent(displayContent);
    
    // Wrap in paragraphs and handle lists
    const finalContent = processedContent
      .replace(/<li/g, '<ul class="list-disc list-inside mb-3"><li')
      .replace(/<\/li>/g, '</li></ul>')
      .replace(/<\/ul><ul/g, '</ul><ul')
      .replace(/<p class="mb-3">/g, '<p class="mb-3 text-gray-700 leading-relaxed">');
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">{title}</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div 
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: finalContent }}
          />
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleSend = () => {
    setRecipientEmail('');
    setSendError('');
    setShowSendModal(true);
  };

  const handleSendProposal = async () => {
    if (!recipientEmail.trim()) {
      setSendError('Please enter a recipient email');
      return;
    }

    if (!proposal) return;

    try {
      setSending(true);
      setSendError('');
      
      await proposalsAPI.sendEmail(proposal.id, { recipientEmail: recipientEmail.trim() });
      
      // Close modal
      setShowSendModal(false);
      setRecipientEmail('');
      
      // Show success message
      toast.success('Proposal sent successfully! It has been moved to Sent Proposals.');
      
      // Refresh the proposal to update its status
      fetchProposal();
    } catch (err: any) {
      setSendError(err.response?.data?.error || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  const renderAnalyticsSection = () => {
    if (generatingAnalytics) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Analytics</h3>
          <p className="text-gray-600">AI is analyzing your proposal to provide insights...</p>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Generated</h3>
          <p className="text-gray-600 mb-6">Generate AI-powered insights to analyze your proposal's effectiveness.</p>
          <button
            onClick={generateAnalytics}
            disabled={generatingAnalytics}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {generatingAnalytics ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <LightBulbIcon className="h-4 w-4" />
                Generate Analytics
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-green-800">Proposal Strength</h4>
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-700 mb-2">{analytics.proposalStrengthScore || 0}/100</div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${analytics.proposalStrengthScore || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-blue-800">Client Fit</h4>
              <LightBulbIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-700 mb-2">{analytics.clientFitScore || 0}/100</div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${analytics.clientFitScore || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-purple-800">Success Probability</h4>
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-700 mb-2">{analytics.successProbability || 0}/100</div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${analytics.successProbability || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              Key Strengths
            </h4>
            <ul className="space-y-3">
              {analytics.keyStrengths?.map((strength: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LightBulbIcon className="h-5 w-5 text-yellow-600" />
              Areas for Improvement
            </h4>
            <ul className="space-y-3">
              {analytics.areasForImprovement?.map((area: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Assessment */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h4>
            <div className="space-y-3">
              {analytics.riskAssessment && Object.entries(analytics.riskAssessment).map(([risk, details]: [string, any]) => (
                <div key={risk} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">{risk}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      details.level === 'High' ? 'bg-red-100 text-red-800' :
                      details.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {details.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{details.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ROI Analysis */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              ROI Potential
            </h4>
            <div className="space-y-3">
              {analytics.roiPotential && Object.entries(analytics.roiPotential).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competitive Analysis */}
        {analytics.competitiveAnalysis && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Competitive Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analytics.competitiveAnalysis).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h5>
                  <p className="text-blue-700">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Feasibility */}
        {analytics.timelineFeasibility && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              Timeline Feasibility
            </h4>
            <div className="space-y-3">
              {Object.entries(analytics.timelineFeasibility).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regenerate Button */}
        <div className="text-center pt-6">
          <button
            onClick={generateAnalytics}
            disabled={generatingAnalytics}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {generatingAnalytics ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Regenerating...
              </>
            ) : (
              <>
                <LightBulbIcon className="h-4 w-4" />
                Regenerate Analytics
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-12">
        {/* Top Navigation Bar */}
        <nav className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg fixed w-full z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-extrabold text-white tracking-wider drop-shadow">ProposalAI</h1>
              </div>
              <div className="flex items-center space-x-8">
                <a href="/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</a>
                <a href="/drafts" className="text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">Drafts</a>
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-12">
        {/* Top Navigation Bar */}
        <nav className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg fixed w-full z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-extrabold text-white tracking-wider drop-shadow">ProposalAI</h1>
              </div>
              <div className="flex items-center space-x-8">
                <a href="/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</a>
                <a href="/drafts" className="text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">Drafts</a>
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
            <p className="text-gray-600 mb-6">The proposal you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/drafts')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Drafts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-lg fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-extrabold text-white tracking-wider drop-shadow">ProposalAI</h1>
            </div>
            <div className="flex items-center space-x-8">
              <a href="/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</a>
              <a href="/drafts" className="text-white font-semibold border-b-2 border-white/80 pb-1 transition-colors">Drafts</a>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/drafts')}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-500 transition shadow"
        >
          ← Back to Drafts
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Client: {proposal.clientName}</span>
                  <span>•</span>
                  <span>Created by {proposal.author.name}</span>
                  <span>•</span>
                  <span>{formatDate(proposal.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                  {getStatusIcon(proposal.status)} {proposal.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => navigate(`/proposals/${proposal.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Proposal
                </button>
                {proposal.status === 'DRAFT' && (
                  <button
                    onClick={handleSend}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-lg hover:from-purple-600 hover:to-purple-500 transition-colors"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Send
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: '📋' },
                  { id: 'comments', label: `Comments (${proposal._count?.comments || 0})`, icon: '💬' },
                  { id: 'activity', label: 'Activity', icon: '📊' },
                  { id: 'analytics', label: 'Analytics', icon: '📈' },
                  { id: 'email-tracking', label: 'Email Tracking', icon: '📧' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {proposal.description && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Description</h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div 
                          className="text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: proposal.description
                              // Bold text
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                              .replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                              
                              // Italic text
                              .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
                              .replace(/_(.*?)_/g, '<em class="italic text-gray-800">$1</em>')
                              
                              // Line breaks
                              .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700 leading-relaxed">')
                              .replace(/\n/g, '<br>')
                              .replace(/^/, '<p class="mb-3 text-gray-700 leading-relaxed">')
                              .replace(/$/, '</p>')
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Handle different content formats */}
                  {proposal.content && (
                    <>
                      {/* If content is a string (fullContent) */}
                      {typeof proposal.content === 'string' && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Proposal Content</h3>
                          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div 
                              className="text-gray-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: (() => {
                                  let content = proposal.content;
                                  
                                  // Try to parse as JSON first
                                  try {
                                    const parsed = JSON.parse(content);
                                    if (typeof parsed === 'object' && parsed !== null) {
                                      // If it's a JSON object, extract the content
                                      if (parsed.fullContent) {
                                        content = parsed.fullContent;
                                      } else if (parsed.executiveSummary) {
                                        content = parsed.executiveSummary;
                                      } else {
                                        // If no specific field, stringify with proper formatting
                                        content = JSON.stringify(parsed, null, 2);
                                      }
                                    }
                                  } catch (e) {
                                    // If not JSON, use as is
                                  }
                                  
                                  // Handle escaped newlines and other characters
                                  content = content
                                    .replace(/\\n/g, '\n')
                                    .replace(/\\t/g, '\t')
                                    .replace(/\\"/g, '"')
                                    .replace(/\\'/g, "'")
                                    .replace(/\\\\/g, '\\');
                                  
                                  return content
                                    // Headers
                                    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                                    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
                                    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
                                    
                                    // Tables - more robust parsing
                                    .replace(/(\|.*\|[\s\S]*?)(?=\n\n|\n[^|]|$)/g, (match) => {
                                      const lines = match.trim().split('\n').filter(line => line.trim());
                                      if (lines.length < 2) return match;
                                      
                                      const tableRows = lines.filter(line => line.includes('|'));
                                      if (tableRows.length < 2) return match;
                                      
                                      let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 bg-white">';
                                      
                                      tableRows.forEach((row, index) => {
                                        const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
                                        
                                        if (index === 0) {
                                          // Header row
                                          tableHtml += '<thead><tr class="bg-gray-50">';
                                          cells.forEach(cell => {
                                            tableHtml += `<th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">${cell}</th>`;
                                          });
                                          tableHtml += '</tr></thead><tbody>';
                                        } else if (index === 1 && cells.every(cell => /^[-:]+$/.test(cell))) {
                                          // Separator row - skip it
                                          return;
                                        } else {
                                          // Data row
                                          tableHtml += '<tr>';
                                          cells.forEach(cell => {
                                            tableHtml += `<td class="border border-gray-300 px-4 py-2 text-sm text-gray-700">${cell}</td>`;
                                          });
                                          tableHtml += '</tr>';
                                        }
                                      });
                                      
                                      tableHtml += '</tbody></table></div>';
                                      return tableHtml;
                                    })
                                    
                                    // Bold text
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                                    .replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                                    
                                    // Italic text
                                    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
                                    .replace(/_(.*?)_/g, '<em class="italic text-gray-800">$1</em>')
                                    
                                    // Code blocks
                                    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto my-3">$1</pre>')
                                    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>')
                                    
                                    // Links
                                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
                                    
                                    // Lists
                                    .replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
                                    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
                                    
                                    // Line breaks
                                    .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700 leading-relaxed">')
                                    .replace(/\n/g, '<br>')
                                    .replace(/^/, '<p class="mb-3 text-gray-700 leading-relaxed">')
                                    .replace(/$/, '</p>')
                                    .replace(/<li/g, '<ul class="list-disc list-inside mb-3"><li')
                                    .replace(/<\/li>/g, '</li></ul>')
                                    .replace(/<\/ul><ul/g, '</ul><ul');
                                })()
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* If content is an object with sections */}
                      {typeof proposal.content === 'object' && proposal.content !== null && (
                        <>
                          {proposal.content.fullContent && 
                            renderContentSection('Full Content', proposal.content.fullContent)}
                          
                          {proposal.content.executiveSummary && 
                            renderContentSection('Executive Summary', proposal.content.executiveSummary)}
                          
                          {proposal.content.problemStatement && 
                            renderContentSection('Problem Statement', proposal.content.problemStatement)}
                          
                          {proposal.content.solution && 
                            renderContentSection('Solution', proposal.content.solution)}
                          
                          {proposal.content.approach && 
                            renderContentSection('Approach', proposal.content.approach)}
                          
                          {proposal.content.timeline && 
                            renderContentSection('Timeline', proposal.content.timeline)}
                          
                          {proposal.content.budgetDetails && 
                            renderContentSection('Budget Details', proposal.content.budgetDetails)}
                          
                          {proposal.content.budget && 
                            renderContentSection('Budget', proposal.content.budget)}
                          
                          {proposal.content.pricing && 
                            renderContentSection('Pricing', proposal.content.pricing)}
                          
                          {proposal.content.nextSteps && 
                            renderContentSection('Next Steps', proposal.content.nextSteps)}
                          
                          {proposal.content.findings && 
                            renderContentSection('Findings', proposal.content.findings)}
                          
                          {proposal.content.recommendations && 
                            renderContentSection('Recommendations', proposal.content.recommendations)}
                        </>
                      )}
                    </>
                  )}

                  {/* Metadata */}
                  {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Additional Information</h3>
                      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(proposal.metadata).map(([key, value]) => (
                            <div key={key} className="p-3 bg-gray-50 rounded-lg">
                              <dt className="text-sm font-medium text-gray-600 capitalize mb-1">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </dt>
                              <dd className="text-sm text-gray-900 font-medium">{String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <Comments 
                  proposalId={proposal.id}
                  currentUserEmail={user?.email}
                />
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  {proposal.activities && proposal.activities.length > 0 ? (
                    <div className="space-y-3">
                      {proposal.activities.map((activity: any) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {activity.user?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{activity.user?.name || 'Unknown User'}</span>
                              {' '}{activity.type.toLowerCase().replace('_', ' ')} this proposal
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No activity recorded yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && renderAnalyticsSection()}

              {activeTab === 'email-tracking' && (
                <EmailTracking proposalId={proposal.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send Proposal Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <PaperAirplaneIcon className="h-6 w-6 text-purple-500" />
              <h3 className="text-xl font-bold text-gray-900">Send Proposal</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Send "{proposal?.title}" to:</p>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={sending}
              />
              {sendError && (
                <p className="text-red-500 text-sm mt-2">{sendError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendProposal}
                disabled={sending || !recipientEmail.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalViewer; 