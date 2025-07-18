import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { snippetsAPI, caseStudiesAPI, pricingAPI } from '../services/api';

interface Snippet {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  clientName?: string;
  industry?: string;
  challenge: string;
  solution: string;
  results: string;
  metrics?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PricingModel {
  id: string;
  name: string;
  description?: string;
  pricing: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type KnowledgeType = 'snippet' | 'case-study' | 'pricing-model';

const KnowledgeBase: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('All Types');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<KnowledgeType>('snippet');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [pricingModels, setPricingModels] = useState<PricingModel[]>([]);
  
  // Form states
  const [snippetForm, setSnippetForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  });
  
  const [caseStudyForm, setCaseStudyForm] = useState({
    title: '',
    description: '',
    clientName: '',
    industry: '',
    challenge: '',
    solution: '',
    results: '',
    metrics: ''
  });
  
  const [pricingForm, setPricingForm] = useState({
    name: '',
    description: '',
    pricing: ''
  });

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    try {
      setLoading(true);
      const [snippetsRes, caseStudiesRes, pricingRes] = await Promise.all([
        snippetsAPI.getAll(),
        caseStudiesAPI.getAll(),
        pricingAPI.getAll()
      ]);
      
      setSnippets(snippetsRes.data.data || []);
      setCaseStudies(caseStudiesRes.data.data || []);
      setPricingModels(pricingRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch knowledge data:', error);
      toast.error('Failed to load knowledge base data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = snippetForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await snippetsAPI.create({
        title: snippetForm.title,
        content: snippetForm.content,
        category: snippetForm.category,
        tags
      });
      
      toast.success('Snippet added successfully!');
      setSnippetForm({ title: '', content: '', category: '', tags: '' });
      setShowAddForm(false);
      fetchKnowledgeData();
    } catch (error) {
      console.error('Failed to add snippet:', error);
      toast.error('Failed to add snippet');
    }
  };

  const handleAddCaseStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const metrics = caseStudyForm.metrics ? JSON.parse(caseStudyForm.metrics) : {};
      await caseStudiesAPI.create({
        title: caseStudyForm.title,
        description: caseStudyForm.description,
        clientName: caseStudyForm.clientName || undefined,
        industry: caseStudyForm.industry || undefined,
        challenge: caseStudyForm.challenge,
        solution: caseStudyForm.solution,
        results: caseStudyForm.results,
        metrics
      });
      
      toast.success('Case study added successfully!');
      setCaseStudyForm({
        title: '', description: '', clientName: '', industry: '',
        challenge: '', solution: '', results: '', metrics: ''
      });
      setShowAddForm(false);
      fetchKnowledgeData();
    } catch (error) {
      console.error('Failed to add case study:', error);
      toast.error('Failed to add case study');
    }
  };

  const handleAddPricingModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pricing = pricingForm.pricing ? JSON.parse(pricingForm.pricing) : {};
      await pricingAPI.create({
        name: pricingForm.name,
        description: pricingForm.description || undefined,
        pricing
      });
      
      toast.success('Pricing model added successfully!');
      setPricingForm({ name: '', description: '', pricing: '' });
      setShowAddForm(false);
      fetchKnowledgeData();
    } catch (error) {
      console.error('Failed to add pricing model:', error);
      toast.error('Failed to add pricing model');
    }
  };

  const getMetrics = () => {
    const totalItems = snippets.length + caseStudies.length + pricingModels.length;
    const totalUsage = snippets.reduce((sum, s) => sum + s.usageCount, 0);
    
    return [
      {
        label: 'Total Items',
        value: totalItems,
        icon: (
          <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M16 3v4M8 3v4" />
          </svg>
        ),
        bg: 'bg-blue-50',
      },
      {
        label: 'Case Studies',
        value: caseStudies.length,
        icon: (
          <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 8h8v8H8z" />
          </svg>
        ),
        bg: 'bg-purple-50',
      },
      {
        label: 'Content Snippets',
        value: snippets.length,
        icon: (
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        ),
        bg: 'bg-green-50',
      },
      {
        label: 'Total Usage',
        value: totalUsage,
        change: '+12% this month',
        icon: (
          <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M21 21H3V3" />
          </svg>
        ),
        bg: 'bg-yellow-50',
      },
    ];
  };

  const filters = ['All Types', 'snippet', 'case study', 'pricing model'];

  const renderAddForm = () => {
    if (!showAddForm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Add {selectedType === 'snippet' ? 'Content Snippet' : 
                      selectedType === 'case-study' ? 'Case Study' : 'Pricing Model'}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {selectedType === 'snippet' && (
              <form onSubmit={handleAddSnippet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={snippetForm.title}
                    onChange={(e) => setSnippetForm({...snippetForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Executive Summary Template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                  <textarea
                    required
                    rows={4}
                    value={snippetForm.content}
                    onChange={(e) => setSnippetForm({...snippetForm, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the content snippet..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={snippetForm.category}
                    onChange={(e) => setSnippetForm({...snippetForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Introduction, Technical, Financial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={snippetForm.tags}
                    onChange={(e) => setSnippetForm({...snippetForm, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., executive, summary, overview (comma separated)"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add Snippet
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {selectedType === 'case-study' && (
              <form onSubmit={handleAddCaseStudy} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={caseStudyForm.title}
                    onChange={(e) => setCaseStudyForm({...caseStudyForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., E-commerce Platform Development"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={caseStudyForm.description}
                    onChange={(e) => setCaseStudyForm({...caseStudyForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the case study..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={caseStudyForm.clientName}
                      onChange={(e) => setCaseStudyForm({...caseStudyForm, clientName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., TechCorp Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={caseStudyForm.industry}
                      onChange={(e) => setCaseStudyForm({...caseStudyForm, industry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., E-commerce"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Challenge *</label>
                  <textarea
                    required
                    rows={3}
                    value={caseStudyForm.challenge}
                    onChange={(e) => setCaseStudyForm({...caseStudyForm, challenge: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the problem or challenge..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Solution *</label>
                  <textarea
                    required
                    rows={3}
                    value={caseStudyForm.solution}
                    onChange={(e) => setCaseStudyForm({...caseStudyForm, solution: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the solution implemented..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Results *</label>
                  <textarea
                    required
                    rows={3}
                    value={caseStudyForm.results}
                    onChange={(e) => setCaseStudyForm({...caseStudyForm, results: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the results and outcomes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metrics (JSON)</label>
                  <textarea
                    rows={2}
                    value={caseStudyForm.metrics}
                    onChange={(e) => setCaseStudyForm({...caseStudyForm, metrics: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='{"salesIncrease": "300%", "costReduction": "40%"}'
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add Case Study
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {selectedType === 'pricing-model' && (
              <form onSubmit={handleAddPricingModel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={pricingForm.name}
                    onChange={(e) => setPricingForm({...pricingForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Standard Package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={pricingForm.description}
                    onChange={(e) => setPricingForm({...pricingForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the pricing model..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pricing (JSON) *</label>
                  <textarea
                    required
                    rows={4}
                    value={pricingForm.pricing}
                    onChange={(e) => setPricingForm({...pricingForm, pricing: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='{"basePrice": 5000, "features": ["Feature 1", "Feature 2"], "duration": "3 months"}'
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add Pricing Model
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderKnowledgeItems = () => {
    const allItems = [
      ...snippets.map(s => ({
        ...s,
        type: 'snippet' as const,
        typeColor: 'bg-blue-100 text-blue-800',
        content: s.content,
        tags: s.tags,
        uses: s.usageCount,
        rating: '9/10'
      })),
      ...caseStudies.map(cs => ({
        ...cs,
        type: 'case study' as const,
        typeColor: 'bg-purple-100 text-purple-800',
        content: cs.description,
        tags: [cs.industry, 'case study'].filter(Boolean),
        uses: 0,
        rating: '10/10'
      })),
             ...pricingModels.map(pm => ({
         ...pm,
         type: 'pricing model' as const,
         typeColor: 'bg-green-100 text-green-800',
         title: pm.name, // Map name to title for consistency
         content: pm.description || 'Custom pricing model',
         tags: ['pricing', 'model'],
         uses: 0,
         rating: '8/10'
       }))
    ];

    const filteredItems = allItems.filter(item => {
      const matchesFilter = selectedFilter === 'All Types' || item.type === selectedFilter;
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                           item.content.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    return filteredItems.map((item, i) => (
      <div key={item.id || i} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full p-1.5 bg-gray-50 border border-gray-200">
            {item.type === 'snippet' && (
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
            )}
            {item.type === 'case study' && (
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 8h8v8H8z" />
              </svg>
            )}
            {item.type === 'pricing model' && (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            )}
          </span>
          <span className="font-semibold text-gray-900 truncate mr-2">{item.title}</span>
          <span className={`badge ${item.typeColor} capitalize ml-auto`}>{item.type}</span>
        </div>
        <div className="text-gray-700 text-sm mb-2 line-clamp-2">{item.content}</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {item.tags.slice(0, 3).map((tag, j) => (
            <span key={j} className="bg-gray-100 text-gray-700 rounded-full px-3 py-0.5 text-xs font-medium">
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="bg-gray-100 text-gray-700 rounded-full px-3 py-0.5 text-xs font-medium">
              +{item.tags.length - 3} more
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
          <span>{item.uses} uses</span>
          <span>{item.rating}</span>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            <svg className="w-9 h-9 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M16 3v4M8 3v4" />
            </svg>
            Knowledge Base
          </h2>
          <p className="text-gray-500 text-lg">Manage your company's content library for AI-powered proposals</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as KnowledgeType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="snippet">Content Snippet</option>
            <option value="case-study">Case Study</option>
            <option value="pricing-model">Pricing Model</option>
          </select>
          <button 
            className="btn btn-primary px-6 py-2 text-base font-semibold"
            onClick={() => setShowAddForm(true)}
          >
            + Add Knowledge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {getMetrics().map((metric, i) => (
          <div key={i} className={`rounded-xl p-5 flex flex-col gap-2 shadow-soft ${metric.bg}`}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2 bg-white shadow-sm">
                {metric.icon}
              </div>
              <span className="text-xs font-medium text-gray-500">{metric.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            {metric.change && <div className="text-xs text-green-600">{metric.change}</div>}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <div className="flex-1 flex items-center bg-white rounded-lg shadow-soft px-4 py-2">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            placeholder="Search knowledge base..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          {filters.map(filter => (
            <button
              key={filter}
              className={`px-4 py-1.5 rounded-lg font-medium text-sm border transition ${
                selectedFilter === filter 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {renderKnowledgeItems()}
      </div>

      {renderAddForm()}
    </div>
  );
};

export default KnowledgeBase; 