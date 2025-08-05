import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'; // Optional icon

const BackButton = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back one step in history
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </button>
  );
};

export default BackButton;
