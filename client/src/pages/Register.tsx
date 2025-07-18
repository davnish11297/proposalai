import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        organizationName: form.companyName,
        organizationSlug: form.companyName.replace(/\s+/g, '-').toLowerCase(),
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Create your ProposalAI account</h1>
          <p className="text-gray-500 text-center text-base">Sign up to get started</p>
        </div>
        <button
          className="w-full flex items-center justify-center border border-gray-200 rounded-lg py-2.5 mb-6 text-gray-700 font-medium hover:bg-gray-50 transition"
          type="button"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.5l6.4-6.4C33.5 5.1 28.1 3 24 3 15.1 3 7.6 8.7 6.3 14.7z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c2.7 0 5.2.9 7.2 2.5l6.4-6.4C33.5 5.1 28.1 3 24 3 15.1 3 7.6 8.7 6.3 14.7z"/><path fill="#FBBC05" d="M24 44c5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.7 0-10.5-3.7-12.2-8.8l-7 5.4C7.6 39.3 15.1 44 24 44z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.2 3.2-4.2 5.5-7.7 5.5-4.5 0-8.2-3.7-8.2-8.2 0-1.3.3-2.5.8-3.5l-7-5.4C7.6 14.7 3 19.8 3 24c0 11.6 9.4 21 21 21 5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.7 0-10.5-3.7-12.2-8.8l-7 5.4C7.6 39.3 15.1 44 24 44z"/></g></svg>
          Continue with Google
        </button>
        <div className="flex items-center w-full mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="input"
                placeholder="First Name"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="input"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a4 4 0 01-8 0v-1" /></svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input pl-10"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              className="input"
              placeholder="Your Company"
              value={form.companyName}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-6v2m6 4V7a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2z" /></svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input pl-10"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-6v2m6 4V7a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2z" /></svg>
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input pl-10"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          {error && <div className="text-danger-600 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary w-full mt-2 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Create account'}
          </button>
        </form>
        <div className="flex justify-between w-full mt-4 text-sm text-gray-500">
          <button className="hover:underline" type="button" onClick={() => navigate('/login')}>Already have an account?</button>
        </div>
      </div>
    </div>
  );
} 