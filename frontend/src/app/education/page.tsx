'use client';

import { useState } from 'react';
import HeroSection from './components/HeroSection';
import AIResponse from './components/AIResponse';
import TopicsGrid from './components/TopicsGrid';
import { generateContent } from './services/geminiService';

export default function EducationPage() {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setResponse(null);
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await generateContent(query);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the response.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    handleSearch(`Tell me about ${topic.toLowerCase()} for women's health.`);
    // Smooth scroll to the response section
    setTimeout(() => {
      const element = document.getElementById('ai-response');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <HeroSection onSearch={handleSearch} />
        
        <div id="ai-response" className="pt-4">
          <AIResponse response={response} isLoading={isLoading} error={error} />
        </div>
        
        <TopicsGrid onTopicClick={handleTopicClick} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Note</h3>
            <p className="text-gray-600">
              The information provided by our AI assistant is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
