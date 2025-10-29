'use client';

import { format, differenceInDays } from 'date-fns';
import { useState, useEffect } from 'react';
import { CycleEntry } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NextPeriodPanelProps {
  userId: string;
}

interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindow: {
    start: string;
    end: string;
  };
  confidence: 'low' | 'medium' | 'high';
  analysis: string;
}

export default function NextPeriodPanel({ userId }: NextPeriodPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<CyclePrediction | null>(null);

  useEffect(() => {
    const fetchCycleData = async () => {
      console.log('Starting to fetch cycle data for user:', userId);
      setIsLoading(true);
      setError(null);
      
      try {
        if (!userId) {
          throw new Error('No user ID provided');
        }

        console.log('Querying Firestore for user:', userId);
        const cyclesRef = collection(db, 'cycleEntries');
        const q = query(
          cyclesRef,
          where('userId', '==', userId),
          orderBy('startDate', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Firestore query completed, found', querySnapshot.size, 'documents');
        
        const entries: CycleEntry[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Processing document:', doc.id, data);
          if (data.startDate) {
            entries.push({ 
              id: doc.id, 
              ...data,
              startDate: data.startDate.toDate ? data.startDate.toDate().toISOString() : data.startDate,
              endDate: data.endDate ? (data.endDate.toDate ? data.endDate.toDate().toISOString() : data.endDate) : null
            } as CycleEntry);
          }
        });

        console.log('Processed entries:', entries);

        if (entries.length > 0) {
          console.log('Generating predictions for', entries.length, 'entries');
          await generatePredictions(entries);
        } else {
          console.log('No cycle entries found for user');
          setError('No cycle data available. Please add your period details.');
        }
      } catch (err) {
        console.error('Error in fetchCycleData:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(`Failed to load cycle data: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      console.log('User ID available, starting data fetch');
      fetchCycleData();
    } else {
      console.log('No user ID available, cannot fetch data');
      setError('User not authenticated. Please sign in.');
      setIsLoading(false);
    }
  }, [userId]);

  const generatePredictions = async (entries: CycleEntry[]) => {
    console.log('Starting prediction generation with entries:', entries);
    
    try {
      // Validate entries
      if (!entries || entries.length === 0) {
        throw new Error('No cycle entries provided for prediction');
      }

      // Validate API key
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        console.error('Gemini API key is not configured');
        throw new Error('Prediction service is not properly configured');
      }

      console.log('Initializing Gemini API');
      const genAI = new GoogleGenerativeAI(apiKey);
      // Using the latest Gemini 2.5 Flash model
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });

      // Prepare cycle data for the prompt
      const cycleData = entries.map(entry => ({
        startDate: entry.startDate,
        endDate: entry.endDate || entry.startDate,
        flowLevel: entry.flowLevel,
        symptoms: entry.symptoms || []
      }));

      console.log('Prepared cycle data for prediction:', cycleData);

      const prompt = `
        Analyze the following menstrual cycle data and predict the next period.
        Be precise with the dates and provide a detailed analysis.
        
        Cycle Data:
        ${JSON.stringify(cycleData, null, 2)}
        
        Respond with a JSON object in this exact format:
        {
          "nextPeriodStart": "YYYY-MM-DD",
          "nextPeriodEnd": "YYYY-MM-DD",
          "fertileWindow": {
            "start": "YYYY-MM-DD",
            "end": "YYYY-MM-DD"
          },
          "ovulationDate": "YYYY-MM-DD",
          "confidence": "low|medium|high",
          "analysis": "Detailed analysis of the prediction"
        }
      `;

      console.log('Sending request to Gemini API');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Received response from Gemini API:', text);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', text);
        throw new Error('Invalid response format from prediction service');
      }
      
      const prediction = JSON.parse(jsonMatch[0]);
      
      // Validate prediction structure
      if (!prediction.nextPeriodStart || !prediction.fertileWindow) {
        console.error('Invalid prediction format:', prediction);
        throw new Error('Received invalid prediction format');
      }
      
      console.log('Prediction successful:', prediction);
      setPredictions(prediction);
      
    } catch (err) {
      console.error('Error in generatePredictions:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(`Failed to generate predictions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (_error) {
      return 'Invalid date';
    }
  };

  const getDaysAway = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffDays = differenceInDays(date, today);
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';
      if (diffDays > 1) return `In ${diffDays} days`;
      return `${Math.abs(diffDays)} days ago`;
    } catch (error) {
      return 'Date error';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Next Period</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Next Period</h2>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  // Error state is handled in the return statement above

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Next Period</h2>
      
      {predictions ? (
        <div className="space-y-4">
          <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-r">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-pink-800">Expected Start</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(predictions.nextPeriodStart)}
                </p>
                <p className="text-sm text-pink-600 mt-1">
                  {getDaysAway(predictions.nextPeriodStart)}
                </p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            {predictions.nextPeriodEnd && (
              <div className="mt-4 pt-4 border-t border-pink-100">
                <p className="text-sm text-gray-600">
                  Expected to last until {formatDate(predictions.nextPeriodEnd)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-pink-500 h-2 rounded-full" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex items-start mt-4">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-pink-700">
                  {predictions.confidence === 'high' 
                    ? 'High confidence prediction based on your cycle history.'
                    : predictions.confidence === 'medium'
                      ? 'Medium confidence prediction. Add more data for better accuracy.'
                      : 'Low confidence prediction. Consider adding more cycle data.'}
                </p>
                {predictions.analysis && (
                  <p className="text-sm text-gray-600 mt-2">{predictions.analysis}</p>
                )}
              </div>
            </div>
          </div>
          
          {predictions.fertileWindow && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700">
                  Fertile window: {formatDate(predictions.fertileWindow.start)} - {formatDate(predictions.fertileWindow.end)}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">No prediction data available</p>
        </div>
      )}
    </div>
  );
}
