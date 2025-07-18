import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { caseStudiesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  clientName: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  metrics: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CaseStudies: React.FC = () => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const response = await caseStudiesAPI.getAll();
      setCaseStudies(response.data.data);
    } catch (err) {
      console.error('Failed to fetch case studies:', err);
      setError('Failed to load case studies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Case Studies</h1>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => toast.success('Add Case Study feature coming soon!')}
        >
          Add Case Study
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading case studies...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : caseStudies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No case studies found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {caseStudies.map((study) => (
            <div key={study.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{study.title}</h3>
                  <p className="text-blue-600 font-medium">{study.clientName}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {study.industry}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{study.description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Key Results:</h4>
                <p className="text-sm text-gray-600">{study.results}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Created: {new Date(study.createdAt).toLocaleDateString()}</span>
                <button 
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  onClick={() => navigate('/proposals/new', { state: { caseStudy: study } })}
                >
                  Use in Proposal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseStudies; 