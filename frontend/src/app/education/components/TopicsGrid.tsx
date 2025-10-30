'use client';

import React from 'react';
import { motion } from 'framer-motion';

const topics = [
  {
    title: 'Menstrual Health',
    description: 'Learn about menstrual cycles, common issues, and how to maintain good menstrual hygiene.',
    icon: (
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    title: 'Pregnancy Care',
    description: 'Essential information about prenatal care, stages of pregnancy, and postpartum recovery.',
    icon: (
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: 'Mental Wellness',
    description: 'Resources for managing stress, anxiety, and maintaining good mental health.',
    icon: (
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Nutrition & Fitness',
    description: 'Healthy eating habits and exercise routines tailored for women at different life stages.',
    icon: (
      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function TopicsGrid({ onTopicClick }: { onTopicClick: (topic: string) => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-text-primary mb-4">Explore Health Topics</h2>
        <p className="text-lg text-text-primary/90 max-w-2xl mx-auto">
          Browse through our collection of women&apos;s health topics to learn more about taking care of your well-being.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-soft border border-white/70 hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-primary/30 flex flex-col h-full"
            onClick={() => onTopicClick(topic.title)}
          >
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {React.cloneElement(topic.icon, { className: 'w-7 h-7 text-primary' })}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">{topic.title}</h3>
            <p className="text-text-primary/90 text-sm leading-relaxed mb-4">{topic.description}</p>
            <div className="mt-auto text-sm text-primary font-medium flex items-center group">
              Learn more
              <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
