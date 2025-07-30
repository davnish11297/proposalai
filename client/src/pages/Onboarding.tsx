import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;

  const { updateUser } = useAuth();

  const handleContinue = async () => {
    if (currentStep === 1 && !name.trim()) {
      return; // Don't proceed if name is empty
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      setIsLoading(true);
      try {
        // Call the onboarding completion API
        const token = localStorage.getItem('token');
        
        const requestBody = {
          name: name.trim(),
          privacyMode,
          industry: selectedIndustry,
          goal: selectedGoal
        };
        
        const response = await fetch('/api/auth/onboarding/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          // Update the user context
          updateUser({ 
            firstName: name.trim(), 
            onboardingCompleted: true 
          });
          
          navigate('/dashboard');
        } else {
          const errorData = await response.json();
          console.error('Onboarding completion failed:', errorData);
        }
      } catch (error) {
        console.error('Onboarding completion failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const canContinue = 
    currentStep === 1 ? name.trim().length > 0 : 
    currentStep === 2 ? selectedIndustry && selectedGoal : 
    currentStep === 3 ? true : 
    true;



  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-orange-600 mb-2">ProposalAI</h1>
          <h2 className="text-xl font-semibold text-gray-900">
            {currentStep === 1 && "Let's personalize your ProposalAI"}
            {currentStep === 2 && "Choose your preferences"}
            {currentStep === 3 && "You're all set!"}
          </h2>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  What's your name?
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm text-gray-600">Privacy mode</span>
                </div>
                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacyMode ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacyMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose your industry</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Consulting'].map((industry) => (
                    <button
                      key={industry}
                      onClick={() => setSelectedIndustry(industry)}
                      className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                        selectedIndustry === industry
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What's your primary goal?</h3>
                <div className="space-y-3">
                  {[
                    'Create proposals faster',
                    'Improve proposal quality',
                    'Track proposal performance',
                    'Collaborate with team'
                  ].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setSelectedGoal(goal)}
                      className={`w-full px-4 py-3 border rounded-lg text-sm font-medium transition-colors text-left ${
                        selectedGoal === goal
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to ProposalAI, {name}!</h3>
                <p className="text-gray-600">
                  Your account is ready. Start creating winning proposals in minutes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index + 1 <= currentStep ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back
            </button>
          )}
          
          <div className="flex gap-3 ml-auto">
            {currentStep < totalSteps && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
            )}
            
            <button
              onClick={handleContinue}
              disabled={!canContinue || isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canContinue && !isLoading
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </div>
              ) : currentStep === totalSteps ? (
                'Get Started'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 