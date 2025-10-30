'use client';

import { useCycle } from '@/contexts/CycleContext';
// Simple date formatting function
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const isBefore = (date1: Date, date2: Date) => date1 < date2;
const isAfter = (date1: Date, date2: Date) => date1 > date2;
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export function CyclePredictionCard() {
  const { 
    predictions, 
    predictionLoading, 
    predictionError, 
    predictNextCycle 
  } = useCycle();

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isFertile = () => {
    if (!predictions?.fertile_window) return false;
    
    const today = new Date();
    const fertileStart = new Date(predictions.fertile_window.start);
    const fertileEnd = new Date(predictions.fertile_window.end);
    
    return isAfter(today, fertileStart) && isBefore(today, fertileEnd);
  };

  if (predictionLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cycle Predictions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
          <span className="ml-2">Analyzing your cycle data...</span>
        </CardContent>
      </Card>
    );
  }

  if (predictionError) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <CardTitle className="text-red-700">Prediction Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">
            We couldn't generate predictions. {predictionError}
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={predictNextCycle}
            className="text-sm"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!predictions) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cycle Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Track at least two cycles to get predictions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Cycle Predictions</CardTitle>
          <Badge 
            className={getConfidenceColor(predictions.confidence)}
            variant="outline"
          >
            {predictions.confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isFertile() && (
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-sm">
            <div className="flex items-center text-pink-700 font-medium">
              <span className="h-2 w-2 bg-pink-500 rounded-full mr-2"></span>
              You're in your fertile window
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Next Period</p>
            <p className="text-lg font-semibold">
              {formatDate(predictions.next_period_date)}
            </p>
            <p className="text-xs text-gray-500">
              {predictions.cycle_length}-day cycle
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Fertile Window</p>
            <p className="text-sm">
              {formatDate(predictions.fertile_window.start).replace(/\d{4}$/, '')} - 
              {formatDate(predictions.fertile_window.end)}
            </p>
            <p className="text-xs text-gray-500">
              Ovulation: {formatDate(predictions.fertile_window.ovulation_day).replace(/\d{4}$/, '')}
            </p>
          </div>
        </div>

        {predictions.notes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            {predictions.notes}
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2 text-sm"
          onClick={predictNextCycle}
        >
          Refresh Predictions
        </Button>
      </CardContent>
    </Card>
  );
}
