import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const { login, checkAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Google OAuth: handle token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setLoading(true);
      localStorage.setItem('token', token);
      checkAuth().finally(() => {
        setLoading(false);
        navigate('/dashboard');
      });
    }
  }, [navigate, checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('Attempting login with:', email);
      await login(email, password);
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error types
      if (err.response?.status === 429) {
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.message?.includes('Too many requests')) {
        setError('Too many requests from this IP. Please wait a few minutes and try again.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again in a few moments.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#0a2540] flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl font-bold text-white tracking-tight">ProposalAI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Welcome to ProposalAI</h1>
          <p className="text-gray-500 text-center text-base">Sign in to continue</p>
        </div>
        <button
          className="w-full flex items-center justify-center border border-gray-200 rounded-lg py-2.5 mb-6 text-gray-700 font-medium hover:bg-gray-50 transition"
          type="button"
          onClick={() => {
            window.location.href = 'http://localhost:3000/api/auth/google';
          }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-8.1 20-21 0-1.3-.1-2.7-.5-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c2.7 0 5.2.9 7.2 2.5l6.4-6.4C33.5 5.1 28.1 3 24 3 15.1 3 7.6 8.7 6.3 14.7z"/><path fill="#FBBC05" d="M24 44c5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.7 0-10.5-3.7-12.2-8.8l-7 5.4C7.6 39.3 15.1 44 24 44z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.2 3.2-4.2 5.5-7.7 5.5-4.5 0-8.2-3.7-8.2-8.2 0-1.3.3-2.5.8-3.5l-7-5.4C7.6 14.7 3 19.8 3 24c0 11.6 9.4 21 21 21 5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.7 0-10.5-3.7-12.2-8.8l-7 5.4C7.6 39.3 15.1 44 24 44z"/></g></svg>
          Continue with Google
        </button>
        <div className="flex items-center w-full mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a4 4 0 01-8 0v-1" /></svg>
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-6v2m6 4V7a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2z" /></svg>
              </span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="input pl-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <div className="text-danger-600 text-sm mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="font-medium">{error}</div>
                  {error.includes('Too many requests') && (
                    <div className="text-xs text-red-600 mt-1">
                      💡 Try refreshing the page or waiting a few minutes before attempting again.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary w-full mt-2 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Sign in'}
          </button>
        </form>
        <div className="flex justify-between w-full mt-4 text-sm text-gray-500">
          <button className="hover:underline" type="button">Forgot password?</button>
          <span>
            Need an account?{' '}
            <button className="font-semibold text-primary-600 hover:underline" type="button" onClick={() => navigate('/register')}>Sign up</button>
          </span>
        </div>
      </div>
    </div>
  );
} 