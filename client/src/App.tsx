import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProposalEditor from './pages/ProposalEditor';
import ProposalViewer from './pages/ProposalViewer';
import Drafts from './pages/Drafts';
import SentProposals from './pages/SentProposals';
import Profile from './pages/Profile';
import Home from './pages/Home';
import PublicProposal from './pages/PublicProposal';
import './index.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/proposal/:id" element={<PublicProposal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    // <ThemeProvider>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/drafts" element={<Drafts />} />
      <Route path="/sent-proposals" element={<SentProposals />} />
      <Route path="/profile" element={<Profile />} />
      {/* <Route path="/proposals" element={<Proposals />} /> */}
      <Route path="/proposals/new" element={<ProposalEditor />} />
      <Route path="/proposals/:id" element={<ProposalEditor />} />
      <Route path="/proposals/:id/view" element={<ProposalViewer />} />
      <Route path="/proposal/:id" element={<PublicProposal />} />
      {/* <Route path="/teams" element={<Teams />} /> */}
      {/* <Route path="/clients" element={<Clients />} /> */}
      {/* <Route path="/templates" element={<Templates />} /> */}
      {/* <Route path="/snippets" element={<Snippets />} /> */}
      {/* <Route path="/case-studies" element={<CaseStudies />} /> */}
      {/* <Route path="/pricing" element={<Pricing />} /> */}
      {/* <Route path="/analytics" element={<Analytics />} /> */}
      {/* <Route path="/settings" element={<Settings />} /> */}
      {/* <Route path="/proposal-builder" element={<ProposalBuilder />} /> */}
      {/* <Route path="/knowledge-base" element={<KnowledgeBase />} /> */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    // </ThemeProvider>
  );
}

export default App; 