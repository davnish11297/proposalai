import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { pricingAPI } from '../services/api';

interface PricingModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    type: string;
    advantages: string[];
    bestFor: string;
    examples: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Pricing: React.FC = () => {
  const [pricingModels, setPricingModels] = useState<PricingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPricingModels();
  }, []);

  const fetchPricingModels = async () => {
    try {
      setLoading(true);
      const response = await pricingAPI.getAll();
      setPricingModels(response.data.data);
    } catch (err) {
      console.error('Failed to fetch pricing models:', err);
      setError('Failed to load pricing models');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pricing Models</h1>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => toast.success('Add Pricing Model feature coming soon!')}
        >
          Add Pricing Model
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading pricing models...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : pricingModels.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No pricing models found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingModels.map((model) => (
            <div key={model.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{model.name}</h3>
              <p className="text-gray-600 mb-4">{model.description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Advantages:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {model.pricing.advantages.map((advantage, index) => (
                    <li key={index}>{advantage}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-900">Best for: </span>
                <span className="text-sm text-gray-600">{model.pricing.bestFor}</span>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  onClick={() => toast.success(`Using pricing model: ${model.name}`)}
                >
                  Use Model
                </button>
                <button 
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                  onClick={() => toast.success(`Editing pricing model: ${model.name}`)}
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

export default Pricing; 