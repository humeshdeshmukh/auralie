'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { format, addDays, isToday, isBefore, isAfter } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Mock data - in a real app, this would come from your database/API
const mockCycleData = {
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: '2025-10-01',
  symptoms: [
    { date: '2025-10-20', mood: 4, energy: 3, symptoms: ['Headache', 'Fatigue'] },
    { date: '2025-10-19', mood: 3, energy: 2, symptoms: ['Cramps', 'Back pain'] },
    { date: '2025-10-18', mood: 2, energy: 2, symptoms: ['Cramps', 'Bloating'] },
  ],
  predictions: {
    nextPeriod: '2025-10-29',
    fertileWindow: { start: '2025-10-15', end: '2025-10-20' },
    ovulation: '2025-10-17',
  },
};

const calculateCycleDay = () => {
  const lastPeriod = new Date(mockCycleData.lastPeriodStart);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % mockCycleData.cycleLength) + 1;
};

const getCyclePhase = (day: number) => {
  if (day <= 5) return { name: 'Menstrual', color: 'bg-pink-100 text-pink-800' };
  if (day <= 11) return { name: 'Follicular', color: 'bg-blue-100 text-blue-800' };
  if (day <= 14) return { name: 'Ovulation', color: 'bg-purple-100 text-purple-800' };
  return { name: 'Luteal', color: 'bg-yellow-100 text-yellow-800' };
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [cycleDay, setCycleDay] = useState(calculateCycleDay());
  const [cyclePhase, setCyclePhase] = useState(getCyclePhase(cycleDay));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Chart data for mood and energy
  const chartData = {
    labels: mockCycleData.symptoms.map(entry => 
      format(new Date(entry.date), 'MMM d')
    ).reverse(),
    datasets: [
      {
        label: 'Mood (1-5)',
        data: [...mockCycleData.symptoms.map(entry => entry.mood)].reverse(),
        borderColor: 'rgb(219, 39, 119)',
        backgroundColor: 'rgba(219, 39, 119, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Energy (1-5)',
        data: [...mockCycleData.symptoms.map(entry => entry.energy)].reverse(),
        borderColor: 'rgb(124, 58, 237)',
        backgroundColor: 'rgba(124, 58, 237, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Mood & Energy Trends',
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Upcoming events
  const upcomingEvents = [
    { 
      date: mockCycleData.predictions.nextPeriod, 
      title: 'Next period expected',
      icon: '🩸',
      color: 'bg-red-100 text-red-800'
    },
    { 
      date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), 
      title: 'Doctor appointment',
      icon: '🏥',
      color: 'bg-blue-100 text-blue-800'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back, {user?.email?.split('@')[0] || 'User'}! 👋</h2>
              <p className="text-gray-600">Here's what's happening with your health today.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cyclePhase.color} mr-2`}>
                {cyclePhase.name} Phase
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Day {cycleDay} of {mockCycleData.cycleLength}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-pink-100 rounded-lg p-3">
                <svg className="h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cycle Day</p>
                <p className="text-2xl font-semibold text-gray-900">{cycleDay}</p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Next Period</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {format(new Date(mockCycleData.predictions.nextPeriod), 'MMM d')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cycle Length</p>
                <p className="text-2xl font-semibold text-gray-900">{mockCycleData.cycleLength} days</p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Period Length</p>
                <p className="text-2xl font-semibold text-gray-900">{mockCycleData.periodLength} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Health Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Mood & Symptoms */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Health Trends</h3>
              <div className="h-64">
                <Line options={chartOptions} data={chartData} />
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Symptoms</h4>
                <div className="space-y-2">
                  {mockCycleData.symptoms.slice(0, 3).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{format(new Date(entry.date), 'MMM d')}</span>
                      <div className="flex space-x-2">
                        <span className="text-sm text-gray-600">Mood: {entry.mood}/5</span>
                        <span className="text-sm text-gray-600">•</span>
                        <div className="flex flex-wrap gap-1">
                          {entry.symptoms.map((symptom, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-800">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming</h3>
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-xl ${event.color} mr-3`}>
                        {event.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.date), 'EEEE, MMM d')}
                          {isToday(new Date(event.date)) && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                              Today
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    href="/health-log"
                    className="p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors text-center"
                  >
                    <div className="mx-auto w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 mb-1">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Log Health</span>
                  </Link>
                  
                  <Link 
                    href="/cycle-tracking"
                    className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
                  >
                    <div className="mx-auto w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-1">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Track Cycle</span>
                  </Link>
                  
                  <Link 
                    href="/education"
                    className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                  >
                    <div className="mx-auto w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-1">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Learn</span>
                  </Link>
                  
                  <Link 
                    href="/profile"
                    className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
                  >
                    <div className="mx-auto w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-1">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Profile</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cycle Tracking Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Cycle Tracking</h3>
              <Link 
                href="/cycle-tracking" 
                className="text-sm font-medium text-pink-600 hover:text-pink-700"
              >
                View Full Calendar →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cycle Phase */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Current Phase</h4>
                <div className="flex items-center">
                  <div className={`h-12 w-1 ${cyclePhase.color.replace('text', 'bg').split(' ')[0]} rounded-full mr-3`}></div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{cyclePhase.name} Phase</p>
                    <p className="text-sm text-gray-500">Day {cycleDay} of {mockCycleData.cycleLength}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {cyclePhase.name === 'Menstrual' && 'Your period has started. Rest and take care of yourself.'}
                    {cyclePhase.name === 'Follicular' && 'Your body is preparing for ovulation. Energy levels are typically higher during this phase.'}
                    {cyclePhase.name === 'Ovulation' && 'You\'re most fertile now. Track your symptoms carefully if you\'re trying to conceive or avoid pregnancy.'}
                    {cyclePhase.name === 'Luteal' && 'You may experience PMS symptoms. Practice self-care and monitor your mood and energy levels.'}
                  </p>
                </div>
              </div>
              
              {/* Fertility Window */}
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fertility Window</h4>
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 mr-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(mockCycleData.predictions.fertileWindow.start), 'MMM d')} - {format(new Date(mockCycleData.predictions.fertileWindow.end), 'MMM d')}
                    </p>
                    <p className="text-xs text-gray-500">Next fertile window</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(mockCycleData.predictions.ovulation), 'EEEE, MMM d')}
                    </p>
                    <p className="text-xs text-gray-500">Predicted ovulation</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="h-2 w-2 bg-pink-500 rounded-full mr-2"></span>
                    <span>High fertility: {format(addDays(new Date(mockCycleData.predictions.fertileWindow.start), -2), 'MMM d')} - {format(new Date(mockCycleData.predictions.ovulation), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                    <span>Peak fertility: {format(new Date(mockCycleData.predictions.ovulation), 'MMM d')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cycle Calendar Mini */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">This Cycle</h4>
                <div className="text-xs text-gray-500">
                  {format(new Date(mockCycleData.lastPeriodStart), 'MMM d')} - {format(addDays(new Date(mockCycleData.lastPeriodStart), mockCycleData.cycleLength), 'MMM d, yyyy')}
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-medium mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className="h-8 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: mockCycleData.cycleLength }).map((_, index) => {
                  const day = index + 1;
                  const currentDate = addDays(new Date(mockCycleData.lastPeriodStart), index);
                  const isPeriodDay = day <= mockCycleData.periodLength;
                  const isOvulationDay = format(currentDate, 'yyyy-MM-dd') === mockCycleData.predictions.ovulation;
                  const isFertile = isAfter(currentDate, new Date(mockCycleData.predictions.fertileWindow.start)) && 
                                  isBefore(currentDate, new Date(mockCycleData.predictions.fertileWindow.end));
                  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <div 
                      key={index} 
                      className={`h-8 rounded-md flex items-center justify-center text-sm font-medium
                        ${isPeriodDay ? 'bg-pink-100 text-pink-800' : ''}
                        ${isOvulationDay ? 'bg-purple-100 text-purple-800 font-bold' : ''}
                        ${isFertile && !isOvulationDay ? 'bg-pink-50 text-pink-600' : ''}
                        ${isToday ? 'ring-2 ring-pink-500' : ''}
                        ${day === cycleDay ? 'font-bold' : ''}
                      `}
                      title={format(currentDate, 'EEEE, MMM d, yyyy')}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-pink-100 rounded-sm mr-1"></span>
                  <span>Period</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-pink-50 rounded-sm mr-1"></span>
                  <span>Fertile</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-purple-100 rounded-sm mr-1"></span>
                  <span>Ovulation</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 ring-1 ring-gray-300 rounded-sm mr-1"></span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Health Logs</h3>
              <Link 
                href="/health-log" 
                className="text-sm font-medium text-pink-600 hover:text-pink-700"
              >
                View All Logs →
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mood
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Energy
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symptoms
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockCycleData.symptoms.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${entry.mood >= 4 ? 'bg-green-500' : entry.mood >= 3 ? 'bg-yellow-500' : 'bg-red-500'} mr-2`}></span>
                          <span className="text-sm text-gray-900">{entry.mood}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${entry.energy >= 4 ? 'bg-green-500' : entry.energy >= 3 ? 'bg-yellow-500' : 'bg-red-500'} mr-2`}></span>
                          <span className="text-sm text-gray-900">{entry.energy}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {entry.symptoms.map((symptom, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {entry.symptoms.join(', ').length > 30 
                          ? `${entry.symptoms.join(', ').substring(0, 30)}...` 
                          : entry.symptoms.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/health-log/edit?date=${entry.date}`} className="text-pink-600 hover:text-pink-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Link 
                href="/health-log/new" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Log
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
