import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { templatesAPI } from '../services/api';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: any;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    proposals: number;
  };
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await templatesAPI.getAll();
      setTemplates(response.data.data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Navigate to proposal editor with template data
      navigate('/proposals/new', { 
        state: { 
          template: {
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            content: template.content
          }
        } 
      });
    }
  };

  const handleEditTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    toast.success(`Editing template: ${template?.name}`);
    // TODO: Navigate to template editor
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Proposal Templates</h1>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => toast.success('Create New Template feature coming soon!')}
        >
          Create New Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading templates...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No templates found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                    {template.category}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Used {template._count.proposals} times</span>
                <span>Created by {template.user.firstName} {template.user.lastName}</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Use Template
                </button>
                <button
                  onClick={() => handleEditTemplate(template.id)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates; 