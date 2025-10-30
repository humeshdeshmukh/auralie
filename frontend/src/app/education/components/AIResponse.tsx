'use client';

import { motion } from 'framer-motion';

type AIResponseProps = {
  response: string | null;
  isLoading: boolean;
  error: string | null;
};

export default function AIResponse({ response, isLoading, error }: AIResponseProps) {
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100 my-8"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Generating response...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg shadow-sm border border-red-100 my-8"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 text-red-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!response) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-soft border border-white/70 my-8"
    >
      <div className="prose max-w-none">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Here&apos;s what I found:</h3>
        <div className="text-text-primary/90 space-y-4 text-base">
          {response.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-text-primary/90">{paragraph}</p>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-primary/30">
          <p className="text-sm text-text-secondary/90">
            This information is for educational purposes only and should not be considered medical advice. 
            Always consult with a healthcare professional for medical concerns.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
