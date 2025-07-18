import React, { useState } from 'react';

const steps = [
  { label: 'Client Info', icon: (
    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ) },
  { label: 'Context', icon: (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
  ) },
  { label: 'Knowledge', icon: (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>
  ) },
  { label: 'Generate', icon: (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
  ) },
];

const companySizes = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
];

export default function ProposalBuilder() {
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');

  return (
    <div className="pb-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-8 mb-10">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`rounded-full bg-white shadow-soft p-2 ${i === 0 ? 'border-2 border-primary-500' : 'border border-gray-200'}`}>{step.icon}</div>
            <span className={`font-medium ${i === 0 ? 'text-primary-700' : 'text-gray-400'}`}>{step.label}</span>
            {i < steps.length - 1 && <span className="w-12 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>
      {/* Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">Tell us about your client</h2>
          <p className="text-gray-500 text-center text-base">Basic information helps our AI understand the context better</p>
        </div>
        <form className="w-full max-w-xl mx-auto">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Company Name <span className="text-primary-500">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Acme Corporation"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              required
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry <span className="text-primary-500">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Healthcare, Technology, Manufacturing"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size <span className="text-primary-500">*</span></label>
            <select
              className="input"
              value={companySize}
              onChange={e => setCompanySize(e.target.value)}
              required
            >
              <option value="">Select company size</option>
              {companySizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center"
          >
            Continue
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
} 