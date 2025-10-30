import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Simple in-memory rate limiting
const rateLimit = {
  lastRequestTime: 0,
  minInterval: 30000, // 30 seconds between requests
};

// Fallback responses when rate limited
const FALLBACK_RESPONSES = [
  "I'm currently experiencing high demand. Please try again in a moment.",
  "I need a short break. Could you ask again in about 30 seconds?",
  "I'm helping other users right now. Please try your question again soon.",
  "I've reached my current capacity. Please wait a moment before asking another question."
];

function getRandomFallbackResponse() {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

export async function generateContent(prompt: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - rateLimit.lastRequestTime;
  
  // Enforce rate limiting
  if (timeSinceLastRequest < rateLimit.minInterval) {
    throw new Error('rate_limited');
  }

  try {
    rateLimit.lastRequestTime = now;
    
    // Using gemini-2.5-flash model with proper configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `As a women's health education assistant, provide a clear, concise response under 100 words to: ${prompt}`
        }]
      }]
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate content. Please try again later.');
  }
}
