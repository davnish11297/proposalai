import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PublicProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch public proposal data
    setTimeout(() => {
      setProposal({
        id: id,
        title: 'Sample Public Proposal',
        clientName: 'Sample Client',
        content: 'This is a sample public proposal content...',
        budget: '$10,000',
        timeline: '2 weeks',
        status: 'submitted',
        createdAt: '2024-01-15'
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
          <p className="text-gray-600">The proposal you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
            <p className="text-gray-600">Prepared for {proposal.clientName}</p>
            <p className="text-sm text-gray-500">Created on {proposal.createdAt}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Budget</h3>
              <p className="text-2xl font-bold text-blue-600">{proposal.budget}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
              <p className="text-2xl font-bold text-green-600">{proposal.timeline}</p>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Details</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed">{proposal.content}</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Status: <span className="font-medium text-green-600">{proposal.status}</span></p>
              </div>
              <div className="flex space-x-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Download PDF
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProposal; 