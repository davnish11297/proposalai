import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ProposalAI</h2>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Join and start building.</h3>
          <p className="text-gray-600 mb-6">Sign in or create a free account to use ProposalAI.</p>
          
          <div className="space-y-3">
            <Link
              to="/register"
              className="w-full bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors block text-center"
              onClick={onClose}
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="w-full bg-white text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors block text-center"
              onClick={onClose}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      setShowModal(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-xl font-bold text-gray-900">ProposalAI</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button className="text-gray-600 hover:text-gray-900 transition">Features</button>
              <button className="text-gray-600 hover:text-gray-900 transition">Pricing</button>
            </nav>
          </div>
          
          {/* Right side - Auth buttons */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition font-medium">Sign in</Link>
            <Link to="/register" className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 text-white text-sm font-medium mb-4">
              AI-powered
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              AI-Powered Proposal Generation & Outreach
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Create, send, and win more proposals with AI. Save time, close more deals, and grow your business with ProposalAI.
            </p>
          </div>

          {/* Main Input Field */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your project or proposal..."
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors"
                  aria-label="Generate Proposal"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium">See AI Suggestions</span>
            </button>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Privacy mode</span>
              <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Left Panel - Problem Research */}
      <div className="fixed left-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="relative">
          <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-yellow-800 font-semibold text-sm">PR</span>
          </div>
          <div className="w-px h-20 bg-gray-300 mx-auto"></div>
          <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">ProposalAI</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Sources</h4>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div className="w-4 h-4 bg-green-500 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Build Product */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="relative">
          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-green-800 font-semibold text-sm">BP</span>
          </div>
          <div className="w-px h-20 bg-gray-300 mx-auto"></div>
          <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">You</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Development plan</h4>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
} 