import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ProposalAI</h2>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Join and start building.</h3>
          <p className="text-gray-600 mb-6">Sign in or create a free account to use ProposalAI.</p>
          
          <div className="space-y-3">
            <Link
              to="/register"
              className="w-full bg-orange-600 text-white font-semibold py-3 px-6 hover:bg-orange-700 transition-colors block text-center rounded-sm"
              onClick={onClose}
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="w-full bg-white text-gray-700 font-semibold py-3 px-6 border border-gray-300 hover:bg-gray-50 transition-colors block text-center rounded-sm"
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
    console.log('handleSubmit called, setting showModal to true');
    setShowModal(true);
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
            <Link to="/register" className="px-4 py-2 bg-orange-600 text-white font-semibold hover:bg-orange-700 transition rounded-sm">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20 relative">
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
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your project or proposal..."
                className="w-full px-8 py-8 text-xl border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <button
                  onClick={handleSubmit}
                  className="w-10 h-10 bg-orange-600 flex items-center justify-center hover:bg-orange-700 transition-colors rounded-sm"
                  aria-label="Generate Proposal"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition border border-gray-300 bg-white hover:bg-gray-50 rounded-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium">Brainstorm ideas</span>
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

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to create winning proposals
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From AI-powered generation to professional templates, we've got everything you need to close more deals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600">Create professional proposals in minutes with our advanced AI technology.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Templates</h3>
              <p className="text-gray-600">Choose from hundreds of industry-specific templates designed to win.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Analytics</h3>
              <p className="text-gray-600">Track performance and optimize your proposals with detailed insights.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Time-Saving</h3>
              <p className="text-gray-600">Save hours on proposal creation with our streamlined workflow.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Client Management</h3>
              <p className="text-gray-600">Organize clients and track proposal history in one place.</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your data is protected with enterprise-grade security measures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to start creating winning proposals?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of professionals who are already using ProposalAI to close more deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-orange-600 text-white font-semibold hover:bg-orange-700 transition rounded-sm"
            >
              Get Started Free
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition rounded-sm">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold">ProposalAI</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The AI-powered platform that helps professionals create, send, and win more proposals. 
                Save time, close more deals, and grow your business.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.107-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Templates</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 ProposalAI. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Left Panel - Problem Research */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="relative">
          <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-yellow-800 font-semibold text-sm animate-bounce">PR</span>
          </div>
          <div className="w-px h-20 bg-gray-300 mx-auto animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-lg p-4 mt-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3 animate-slide-in-left">
              <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full animate-pulse">ProposalAI</span>
              <svg className="w-4 h-4 text-gray-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2 animate-fade-in">Sources</h4>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 bg-gray-200 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="w-4 h-4 bg-red-500 rounded animate-ping"></div>
              <div className="w-4 h-4 bg-blue-500 rounded animate-ping" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-4 h-4 bg-green-500 rounded animate-ping" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Build Product */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
        <div className="relative">
          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-green-800 font-semibold text-sm animate-bounce">BP</span>
          </div>
          <div className="w-px h-20 bg-gray-300 mx-auto animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-lg p-4 mt-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3 animate-slide-in-right">
              <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full animate-pulse">You</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2 animate-fade-in">Development plan</h4>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full animate-progress" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
} 