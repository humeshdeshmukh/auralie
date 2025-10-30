'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const healthTopics = [
  'menstrual health',
  'pregnancy care',
  'mental wellness',
  'nutrition',
  'exercise',
  'reproductive health'
];

export default function HeroSection({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  // Suggestions functionality can be implemented later if needed

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };

  return (
    <div className="relative bg-gradient-to-r from-background-light to-background-secondary/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-text-primary mb-6"
        >
          Women&apos;s Health Education
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-text-primary/90 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          Get accurate, AI-powered answers to your health questions. Ask anything about women&apos;s health, wellness, and more.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative max-w-2xl mx-auto"
        >
          <form onSubmit={handleSearch}>
            <div className="flex">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about women's health..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent text-text-primary placeholder-text-secondary/60"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-r-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl hover:shadow-primary/20"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-text-secondary/80 mr-2 self-center">Try:</span>
            {healthTopics.slice(0, 4).map((topic) => (
              <button
                key={topic}
                onClick={() => handleSuggestionClick(topic)}
                className="px-3 py-1 text-sm bg-white text-primary rounded-full border border-primary/20 hover:bg-primary/5 transition-all duration-300"
              >
                {topic}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
