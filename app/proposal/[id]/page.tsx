'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface Proposal {
  _id: string;
  title: string;
  description?: string;
  content: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  clientInfo?: {
    name?: string;
    email?: string;
  };
  organization?: {
    name: string;
    slug: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function PublicProposalPage() {
  const params = useParams();
  const proposalId = params.id as string;
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proposalId) {
      fetchPublicProposal();
    }
  }, [proposalId]);

  const fetchPublicProposal = async () => {
    try {
      setLoading(true);
      // This would be a public endpoint that doesn't require authentication
      const response = await fetch(`/api/public/proposals/${proposalId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Proposal not found or is no longer available.');
        } else {
          setError('Failed to load proposal.');
        }
        return;
      }

      const data = await response.json();
      setProposal(data.data);
      
      // Track view (optional)
      try {
        await fetch(`/api/public/proposals/${proposalId}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewedAt: new Date().toISOString(),
            userAgent: navigator.userAgent
          })
        });
      } catch (viewError) {
        // Silently fail view tracking
        console.warn('Failed to track view:', viewError);
      }
    } catch (error) {
      console.error('Error fetching public proposal:', error);
      setError('Failed to load proposal.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading proposal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Proposal Not Found'}
            </h1>
            <p className="text-gray-600 mb-6">
              The proposal you're looking for doesn't exist or is no longer available.
            </p>
            <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Visit ProposalAI
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">PA</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ProposalAI</h1>
                {proposal.organization && (
                  <p className="text-sm text-gray-600">by {proposal.organization.name}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Proposal</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(proposal.createdAt)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
          {/* Proposal Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{proposal.title}</h1>
            {proposal.description && (
              <p className="text-xl text-gray-600 leading-relaxed">{proposal.description}</p>
            )}
          </div>

          {/* Client Greeting */}
          {proposal.clientInfo?.name && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <p className="text-blue-900 font-medium">
                Dear {proposal.clientInfo.name},
              </p>
              <p className="text-blue-800 mt-2">
                Thank you for your interest. Please find our detailed proposal below.
              </p>
            </div>
          )}

          {/* Proposal Content */}
          <div className="prose prose-lg prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-8 text-lg">
              {proposal.content}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                {proposal.user && (
                  <p className="text-gray-600">
                    Prepared by <span className="font-medium text-gray-900">
                      {proposal.user.firstName} {proposal.user.lastName}
                    </span>
                  </p>
                )}
                {proposal.organization && (
                  <p className="text-gray-600 mt-1">
                    <span className="font-medium text-gray-900">{proposal.organization.name}</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Generated with</p>
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  ProposalAI
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Questions about this proposal?</h3>
            <p className="text-gray-600 mb-4">
              We'd love to discuss how we can help bring your project to life.
            </p>
            {proposal.clientInfo?.email && (
              <p className="text-sm text-gray-500">
                Reply directly to the email or contact us to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}