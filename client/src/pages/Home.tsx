import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/') }>
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">PA</span>
            </div>
            <span className="ml-2 text-2xl font-extrabold text-gray-900 tracking-tight">ProposalAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-base font-semibold">
            <a href="#features" className="text-gray-700 hover:text-blue-700 transition">Features</a>
            <a href="#" className="text-gray-700 hover:text-blue-700 transition">Pricing</a>
            <Link to="/login" className="text-gray-700 hover:text-blue-700 transition">Login</Link>
            <Link to="/register" className="ml-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition">Get Started</Link>
          </nav>
          <div className="md:hidden">
            {/* Mobile menu button (optional) */}
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          AI-Powered Proposal Generation & Outreach
        </h1>
        <p className="text-lg sm:text-2xl text-gray-600 mb-8 max-w-2xl">
          Create, send, and win more proposals with AI. Save time, close more deals, and grow your business with ProposalAI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link to="/register" className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold text-lg shadow-md hover:bg-blue-700 transition">
            Get Started Free
          </Link>
          <a href="#features" className="px-8 py-3 rounded-lg bg-white text-blue-700 font-bold text-lg border border-blue-200 shadow hover:bg-blue-50 transition">
            See Demo
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          <img src="/logo1.svg" alt="Logo1" className="h-8 opacity-70" />
          <img src="/logo2.svg" alt="Logo2" className="h-8 opacity-70" />
          <img src="/logo3.svg" alt="Logo3" className="h-8 opacity-70" />
          <img src="/logo4.svg" alt="Logo4" className="h-8 opacity-70" />
        </div>
        <div className="mt-6 text-gray-400 text-sm">Trusted by 1,000+ businesses</div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">AI Proposal Builder</h3>
            <p className="text-gray-600">Generate professional proposals in seconds with AI-powered content and templates.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 01-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Automated Outreach</h3>
            <p className="text-gray-600">Send proposals, follow-ups, and reminders automatically to your leads and clients.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100">
            <div className="bg-purple-100 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Analytics & Insights</h3>
            <p className="text-gray-600">Track opens, engagement, and proposal performance with real-time analytics.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
            <h4 className="font-bold mb-2">1. Sign Up</h4>
            <p className="text-gray-600">Create your free account in seconds.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 01-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h4 className="font-bold mb-2">2. Generate</h4>
            <p className="text-gray-600">Describe your project and let AI build your proposal.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-purple-100 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h4 className="font-bold mb-2">3. Send</h4>
            <p className="text-gray-600">Send your proposal to clients with one click.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-yellow-100 rounded-full p-4 mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h4 className="font-bold mb-2">4. Win</h4>
            <p className="text-gray-600">Track, follow up, and win more deals with analytics.</p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Who Is It For?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100">
            <h3 className="text-xl font-bold mb-2">Agencies</h3>
            <p className="text-gray-600">Scale your proposal process and win more clients with automation.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100">
            <h3 className="text-xl font-bold mb-2">Freelancers</h3>
            <p className="text-gray-600">Save time and stand out with AI-generated, professional proposals.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100">
            <h3 className="text-xl font-bold mb-2">Sales Teams</h3>
            <p className="text-gray-600">Automate outreach, track performance, and close more deals.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <p className="text-lg text-gray-700 mb-4">“ProposalAI helped us close deals 2x faster. The AI-generated proposals are always on point!”</p>
            <div className="flex items-center gap-3">
              <img src="/avatar1.png" alt="User1" className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-bold text-gray-900">Alex Siderius</div>
                <div className="text-sm text-gray-500">CEO at Webaware</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <p className="text-lg text-gray-700 mb-4">“I’ve tried every proposal tool out there—ProposalAI is the only one that feels like magic.”</p>
            <div className="flex items-center gap-3">
              <img src="/avatar2.png" alt="User2" className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-bold text-gray-900">Sam Wilson</div>
                <div className="text-sm text-gray-500">Managing Director at Canbury Partners</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Ready to win more proposals?</h2>
        <p className="text-lg text-gray-600 mb-8">Start for free—no credit card required.</p>
        <Link to="/register" className="px-10 py-4 rounded-lg bg-blue-600 text-white font-bold text-xl shadow-md hover:bg-blue-700 transition">
          Get Started Free
        </Link>
      </section>
    </div>
  );
} 