import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  industry?: string;
  tags: string[];
  rating: {
    average: number;
    count: number;
  };
  usageCount: number;
  analytics: {
    successRate: number;
    avgResponseTime: string;
    lastUsed: Date | null;
  };
  isSystemTemplate: boolean;
  userId?: {
    firstName: string;
    lastName: string;
  };
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  templates: Template[];
  confidence: number;
}

interface TemplateSelectorProps {
  clientId?: string;
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  clientId,
  onSelectTemplate,
  onClose,
  isOpen,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'BUSINESS_PROPOSAL', label: 'Business Proposal' },
    { value: 'RFP_RESPONSE', label: 'RFP Response' },
    { value: 'SALES_PROPOSAL', label: 'Sales Proposal' },
    { value: 'PROJECT_PROPOSAL', label: 'Project Proposal' },
    { value: 'SERVICE_AGREEMENT', label: 'Service Agreement' },
    { value: 'QUOTE', label: 'Quote' },
  ];
  
  const industries = [
    { value: 'all', label: 'All Industries' },
    { value: 'technology', label: 'Technology' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
  ];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedIndustry !== 'all' && { industry: selectedIndustry }),
        ...(clientId && { clientId, recommendations: 'true' }),
      });

      const response = await fetch(`/api/templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.data.templates);
      setRecommendations(data.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, selectedCategory, selectedIndustry, clientId]);

  // Filter templates based on search
  const filteredTemplates = templates.filter(template => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.description?.toLowerCase().includes(searchLower) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    onClose();
    toast.success(`Template "${template.name}" selected!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
            <p className="text-gray-600 mt-1">Choose a template to start your proposal</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {industries.map(ind => (
                <option key={ind.value} value={ind.value}>{ind.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Templates List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Smart Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Recommended for You</h3>
                    <div className="space-y-4">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-blue-900">{rec.title}</h4>
                              <p className="text-sm text-blue-700">{rec.description}</p>
                            </div>
                            <div className="bg-blue-100 px-3 py-1 rounded-full">
                              <span className="text-xs font-medium text-blue-800">
                                {Math.round(rec.confidence * 100)}% match
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rec.templates.map((template) => (
                              <div
                                key={template.id}
                                className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 cursor-pointer transition-all group"
                                onClick={() => handleTemplateSelect(template)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                                    {template.name}
                                  </h5>
                                  <div className="flex items-center gap-1">
                                    {renderStars(template.rating.average)}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                    {template.analytics.successRate}% success
                                  </span>
                                  <span className="text-gray-500">{template.usageCount} uses</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Templates */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    All Templates ({filteredTemplates.length})
                  </h3>
                  
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">No templates found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer transition-all group"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {template.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                              </div>
                              {template.isSystemTemplate && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full ml-2">
                                  Official
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 mb-3">
                              {renderStars(template.rating.average)}
                              <span className="text-sm text-gray-500 ml-1">({template.rating.count})</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                  {template.analytics.successRate}% success
                                </span>
                                <span className="text-gray-500 text-xs">{template.usageCount} uses</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTemplateSelect(template);
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                Use Template
                              </button>
                            </div>
                            
                            {template.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {template.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <span key={tagIndex} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {previewTemplate && (
            <div className="w-1/3 border-l border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{previewTemplate.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{previewTemplate.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(previewTemplate.rating.average)}
                      <span>({previewTemplate.rating.count})</span>
                    </div>
                    <span>{previewTemplate.analytics.successRate}% success</span>
                  </div>
                  
                  <button
                    onClick={() => handleTemplateSelect(previewTemplate)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-4"
                  >
                    Use This Template
                  </button>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-3">Content Preview</h5>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-10">
                    {previewTemplate.content.slice(0, 500)}...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};