# Women's Health Education Feature

This feature provides an AI-powered educational platform focused on women's health, utilizing the Gemini 1.5 Flash model to answer health-related questions.

## Features

- **AI-Powered Q&A**: Get accurate, AI-generated responses to women's health questions
- **Topic Exploration**: Browse common health topics with curated content
- **Responsive Design**: Works on all device sizes
- **Accessible UI**: Built with accessibility in mind

## Components

1. **HeroSection**: Main search interface with suggested health topics
2. **AIResponse**: Displays AI-generated responses with loading and error states
3. **TopicsGrid**: Grid layout for exploring different health topics

## Setup

1. Install required dependencies:
   ```bash
   npm install @google/generative-ai framer-motion
   ```

2. Set up your Gemini API key in your environment variables:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

3. The feature is ready to use at `/education` route.

## Usage

1. Enter a health-related question in the search bar
2. Click on suggested topics for quick searches
3. View the AI-generated response
4. Browse more topics for additional information

## Error Handling

- Displays user-friendly error messages for API failures
- Shows loading states during content generation
- Provides fallback content when no search has been performed

## Styling

Uses Tailwind CSS for styling with a clean, modern design that matches the Auralie color scheme.
