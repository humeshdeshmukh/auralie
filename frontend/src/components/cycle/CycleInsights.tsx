'use client';

import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type CycleData = {
  date: string;
  flow: 'light' | 'medium' | 'heavy' | 'spotting' | 'none';
  symptoms: string[];
  mood: string;
  notes?: string;
};

const CycleInsights = () => {
  const [cycleData, setCycleData] = useState<CycleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('6m');

  // Generate mock data for the last 6 months
  useEffect(() => {
    const fetchCycleData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock data for the last 6 months
        const mockData: CycleData[] = [];
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);
        
        // Generate data for each month
        for (let i = 0; i < 6; i++) {
          const monthData = generateMonthData(subMonths(now, 5 - i));
          mockData.push(...monthData);
        }
        
        setCycleData(mockData);
      } catch (err) {
        console.error('Error fetching cycle data:', err);
        setError('Failed to load cycle insights');
      } finally {
        setLoading(false);
      }
    };

    fetchCycleData();
  }, [timeRange]);

  // Helper function to generate mock data for a month
  const generateMonthData = (month: Date): CycleData[] => {
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const data: CycleData[] = [];
    
    // Generate 5-7 days of period data
    const periodLength = Math.floor(Math.random() * 3) + 5; // 5-7 days
    const periodStartDay = Math.floor(Math.random() * 10) + 1; // Start between day 1-10
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isPeriodDay = day >= periodStartDay && day < periodStartDay + periodLength;
      const flow: any = isPeriodDay 
        ? ['light', 'medium', 'heavy', 'spotting'][Math.floor(Math.random() * 4)]
        : 'none';
      
      const moods = ['happy', 'sad', 'tired', 'energetic', 'anxious', 'normal'];
      const symptoms = ['Cramps', 'Headache', 'Bloating', 'Backache', 'Fatigue', 'Nausea'];
      
      const daySymptoms = isPeriodDay 
        ? [...new Set(Array(Math.floor(Math.random() * 3)).fill(0).map(() => 
            symptoms[Math.floor(Math.random() * symptoms.length)]
          ))]
        : [];
      
      data.push({
        date: new Date(month.getFullYear(), month.getMonth(), day).toISOString(),
        flow,
        mood: moods[Math.floor(Math.random() * moods.length)],
        symptoms: daySymptoms,
        notes: isPeriodDay && Math.random() > 0.7 ? 'Sample note about this day' : undefined
      });
    }
    
    return data;
  };

  // Prepare data for charts
  const prepareFlowChartData = () => {
    const filteredData = cycleData.filter(entry => 
      new Date(entry.date) >= subMonths(new Date(), 
        timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12)
    );
    
    const labels = filteredData.map(entry => format(new Date(entry.date), 'MMM d'));
    const flowValues = filteredData.map(entry => {
      switch(entry.flow) {
        case 'none': return 0;
        case 'spotting': return 1;
        case 'light': return 2;
        case 'medium': return 3;
        case 'heavy': return 4;
        default: return 0;
      }
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Flow Intensity',
          data: flowValues,
          borderColor: 'rgb(236, 72, 153)',
          backgroundColor: 'rgba(236, 72, 153, 0.5)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const prepareSymptomChartData = () => {
    const symptomCount: Record<string, number> = {};
    
    cycleData.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    });
    
    const labels = Object.keys(symptomCount);
    const data = Object.values(symptomCount);
    
    // Generate colors for each symptom
    const backgroundColors = labels.map((_, i) => {
      const hue = (i * 137.508) % 360; // Golden angle approximation
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareMoodChartData = () => {
    const moodCount: Record<string, number> = {};
    
    cycleData.forEach(entry => {
      moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1;
    });
    
    const labels = Object.keys(moodCount);
    const data = Object.values(moodCount);
    
    // Mood colors
    const moodColors: Record<string, string> = {
      happy: '#4ade80',
      sad: '#60a5fa',
      tired: '#a78bfa',
      energetic: '#fbbf24',
      anxious: '#f87171',
      normal: '#9ca3af'
    };
    
    const backgroundColors = labels.map(mood => moodColors[mood] || '#9ca3af');
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Flow Intensity Over Time',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 4,
        ticks: {
          callback: (value: number) => {
            const labels = ['None', 'Spotting', 'Light', 'Medium', 'Heavy'];
            return labels[value] || '';
          },
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Symptom Frequency',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Mood Distribution',
      },
    },
  };

  // Calculate insights
  const calculateInsights = () => {
    if (cycleData.length === 0) return null;
    
    const periodDays = cycleData.filter(entry => entry.flow !== 'none');
    const cycleStarts = [];
    
    // Find cycle starts (first day of period after no period)
    for (let i = 1; i < cycleData.length; i++) {
      if (cycleData[i].flow !== 'none' && cycleData[i-1].flow === 'none') {
        cycleStarts.push(new Date(cycleData[i].date));
      }
    }
    
    // Calculate cycle lengths
    const cycleLengths = [];
    for (let i = 1; i < cycleStarts.length; i++) {
      const diff = (cycleStarts[i].getTime() - cycleStarts[i-1].getTime()) / (1000 * 60 * 60 * 24);
      cycleLengths.push(Math.round(diff));
    }
    
    // Calculate average cycle length
    const avgCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28; // Default if not enough data
    
    // Calculate period length
    let currentPeriodLength = 0;
    const periodLengths: number[] = [];
    
    for (let i = 0; i < cycleData.length; i++) {
      if (cycleData[i].flow !== 'none') {
        currentPeriodLength++;
      } else if (currentPeriodLength > 0) {
        periodLengths.push(currentPeriodLength);
        currentPeriodLength = 0;
      }
    }
    
    const avgPeriodLength = periodLengths.length > 0 
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5; // Default if not enough data
    
    // Predict next period (simple prediction based on average)
    const lastPeriodStart = cycleStarts.length > 0 
      ? cycleStarts[cycleStarts.length - 1] 
      : subMonths(new Date(), 1);
    
    const nextPeriodStart = new Date(lastPeriodStart);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + avgCycleLength);
    
    // Calculate fertile window (5 days before and including ovulation day, which is ~14 days before next period)
    const fertileWindowStart = new Date(nextPeriodStart);
    fertileWindowStart.setDate(nextPeriodStart.getDate() - 19);
    
    const fertileWindowEnd = new Date(fertileWindowStart);
    fertileWindowEnd.setDate(fertileWindowStart.getDate() + 5);
    
    return {
      avgCycleLength,
      avgPeriodLength,
      nextPeriodStart,
      fertileWindowStart,
      fertileWindowEnd,
      cycleStarts,
    };
  };

  const insights = calculateInsights();
  const flowChartData = prepareFlowChartData();
  const symptomChartData = prepareSymptomChartData();
  const moodChartData = prepareMoodChartData();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Cycle Insights</h2>
          <div className="flex space-x-2">
            {['3m', '6m', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === range
                    ? 'bg-pink-100 text-pink-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Cycle Insights</h2>
        <div className="text-center py-8 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Cycle Insights</h2>
          <div className="flex space-x-2 mt-2 md:mt-0">
            {['3m', '6m', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === range
                    ? 'bg-pink-100 text-pink-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-pink-800">Average Cycle</h3>
              <p className="text-2xl font-bold text-pink-700">{insights.avgCycleLength} days</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Average Period</h3>
              <p className="text-2xl font-bold text-blue-700">{insights.avgPeriodLength} days</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Next Period</h3>
              <p className="text-xl font-bold text-purple-700">
                {format(insights.nextPeriodStart, 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-purple-600">
                {Math.ceil((insights.nextPeriodStart.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
              </p>
            </div>
            {insights.fertileWindowStart && insights.fertileWindowEnd && (
              <div className="bg-green-50 p-4 rounded-lg col-span-1 md:col-span-3 lg:col-span-1">
                <h3 className="text-sm font-medium text-green-800">Fertile Window</h3>
                <p className="text-lg font-bold text-green-700">
                  {format(insights.fertileWindowStart, 'MMM d')} - {format(insights.fertileWindowEnd, 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-green-600">
                  {insights.fertileWindowStart <= new Date() && insights.fertileWindowEnd >= new Date()
                    ? 'You\'re in your fertile window now!'
                    : insights.fertileWindowStart > new Date()
                    ? 'Starts in ' + Math.ceil((insights.fertileWindowStart.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + ' days'
                    : 'Ended ' + Math.floor((new Date().getTime() - insights.fertileWindowEnd.getTime()) / (1000 * 60 * 60 * 24)) + ' days ago'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <Line options={lineChartOptions} data={flowChartData} />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <Bar options={barChartOptions} data={symptomChartData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 lg:col-span-1">
            <Doughnut options={doughnutOptions} data={moodChartData} />
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cycle Summary</h3>
            {insights && insights.cycleStarts.length > 1 ? (
              <div>
                <p className="text-gray-700 mb-4">
                  Based on your tracking data, your cycles average <span className="font-semibold">
                  {insights.avgCycleLength} days</span> in length, with periods lasting about{' '}
                  <span className="font-semibold">{insights.avgPeriodLength} days</span>.
                </p>
                <p className="text-gray-700 mb-4">
                  Your next period is predicted to start around{' '}
                  <span className="font-semibold">
                    {format(insights.nextPeriodStart, 'EEEE, MMMM d, yyyy')}
                  </span>.
                </p>
                <p className="text-gray-700">
                  Your most frequent symptoms are{' '}
                  <span className="font-semibold">
                    {Object.entries(symptomChartData.datasets[0].data)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([i, _]) => symptomChartData.labels[Number(i)])
                      .join(', ')}
                  </span>.
                </p>
              </div>
            ) : (
              <p className="text-gray-600">
                {insights && insights.cycleStarts.length === 1
                  ? 'Track more cycles to see personalized insights and predictions.'
                  : 'Start tracking your cycle to see personalized insights and predictions.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleInsights;
