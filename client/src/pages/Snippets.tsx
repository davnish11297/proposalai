import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { snippetsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

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

const Snippets: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const response = await snippetsAPI.getAll();
      setSnippets(response.data.data);
    } catch (err) {
      console.error('Failed to fetch snippets:', err);
      setError('Failed to load snippets');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSnippet = async (snippet: Snippet) => {
    try {
      // Increment usage count
      await snippetsAPI.incrementUsage(snippet.id);
      
      // Refresh the snippets list to show updated usage count
      await fetchSnippets();
      
      // Navigate to proposal editor with snippet data
      navigate('/proposals/new', { state: { snippet } });
      
      toast.success(`Using snippet: ${snippet.title}`);
    } catch (err) {
      console.error('Failed to increment snippet usage:', err);
      toast.error('Failed to track snippet usage');
      
      // Still navigate even if usage tracking fails
      navigate('/proposals/new', { state: { snippet } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Snippets</h1>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => toast.success('Add Snippet feature coming soon!')}
        >
          Add Snippet
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading snippets...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No snippets found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {snippets.map((snippet) => (
            <div key={snippet.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{snippet.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{snippet.content}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {snippet.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Used {snippet.usageCount} times</span>
                <button 
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  onClick={() => handleUseSnippet(snippet)}
                >
                  Use Snippet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Snippets; 