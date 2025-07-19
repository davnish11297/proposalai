import React from 'react';

interface SuggestionButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  color: 'yellow' | 'blue' | 'purple' | 'orange' | 'red' | 'green';
  isSelected?: boolean;
  isDisabled?: boolean;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({ 
  icon, 
  text, 
  onClick, 
  color, 
  isSelected = false, 
  isDisabled = false 
}) => {
  const colorClasses = {
    yellow: isSelected 
      ? 'bg-yellow-500 text-white border-yellow-500' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
    blue: isSelected 
      ? 'bg-blue-500 text-white border-blue-500' 
      : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    purple: isSelected 
      ? 'bg-purple-500 text-white border-purple-500' 
      : 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    orange: isSelected 
      ? 'bg-orange-500 text-white border-orange-500' 
      : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
    red: isSelected 
      ? 'bg-red-500 text-white border-red-500' 
      : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    green: isSelected 
      ? 'bg-green-500 text-white border-green-500' 
      : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
  };

  const disabledClasses = isDisabled 
    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' 
    : '';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg border
        transition-all duration-200 font-medium text-sm
        ${isDisabled ? disabledClasses : colorClasses[color]}
        ${!isDisabled && !isSelected ? 'hover:shadow-md' : ''}
      `}
    >
      <div className="flex-shrink-0 w-5 h-5">
        {icon}
      </div>
      <span>{text}</span>
    </button>
  );
};

export default SuggestionButton; 