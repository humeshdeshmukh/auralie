import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { DefaultIcon } from '../page';

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  subtext?: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const StatCard = React.memo<StatCardProps>(({ title, value, subtext, icon, className = '' }) => (
  <div className={`bg-white overflow-hidden shadow rounded-xl p-6 hover:shadow-md transition-all duration-200 ${className}`}>
    <div className="flex items-start">
      <div className="flex-shrink-0 bg-pink-100 rounded-lg p-3">
        {icon || <DefaultIcon />}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
      </div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

interface StatsCardsProps {
  cycleDay: number;
  nextPeriod: string | null;
  cycleLength: number;
  periodLength: number;
  fertileWindow?: {
    start: string;
    end: string;
    ovulationDay: string;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  cycleDay,
  nextPeriod,
  cycleLength,
  periodLength,
  fertileWindow,
}) => {
  const getDaysUntilNextPeriod = () => {
    if (!nextPeriod) return null;
    const today = new Date();
    const nextPeriodDate = new Date(nextPeriod);
    const diffDays = differenceInDays(nextPeriodDate, today);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `in ${diffDays} days`;
  };

  const getFertilityStatus = () => {
    if (!fertileWindow) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const ovulationDate = fertileWindow.ovulationDay.split('T')[0];
    
    if (today === ovulationDate) return { status: 'Ovulation Day', color: 'bg-purple-100 text-purple-800' };
    
    const fertileStart = new Date(fertileWindow.start);
    const fertileEnd = new Date(fertileWindow.end);
    const currentDate = new Date();
    
    if (currentDate >= fertileStart && currentDate <= fertileEnd) {
      return { status: 'Fertile Window', color: 'bg-pink-50 text-pink-700' };
    }
    
    return null;
  };

  const fertilityStatus = getFertilityStatus();
  const daysUntilNextPeriod = getDaysUntilNextPeriod();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Next Period" 
          value={
            <div className="flex items-center">
              {nextPeriod ? format(new Date(nextPeriod), 'MMM d') : '--'}
              {daysUntilNextPeriod && (
                <span className="ml-2 text-sm text-gray-500">
                  ({daysUntilNextPeriod})
                </span>
              )}
            </div>
          }
          subtext={
            <div className="h-4">
              {/* Empty div to maintain consistent height */}
            </div>
          }
        />
        
        <StatCard 
          title="Cycle Length" 
          value={`${cycleLength} days`} 
          subtext={
            <div className="flex items-center">
              {cycleLength < 21 || cycleLength > 35 ? (
                <>
                  <svg className="w-3 h-3 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-600">Consider consulting a doctor</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Normal range</span>
                </>
              )}
            </div>
          }
        />
        
        <StatCard 
          title={fertilityStatus ? 'Fertility' : 'Period Length'} 
          value={
            fertilityStatus ? (
              <div className="flex items-center">
                <span className={`px-2 py-0.5 text-xs rounded-full ${fertilityStatus.color} font-medium`}>
                  {fertilityStatus.status}
                </span>
              </div>
            ) : (
              `${periodLength} days`
            )
          } 
          subtext={
            fertilityStatus ? (
              fertileWindow ? (
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 text-pink-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Ovulation: {format(new Date(fertileWindow.ovulationDay), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 text-pink-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                    </svg>
                    <span>Fertile: {format(new Date(fertileWindow.start), 'MMM d')} - {format(new Date(fertileWindow.end), 'd')}</span>
                  </div>
                </div>
              ) : null
            ) : (
              <div className="flex items-center">
                {periodLength > 7 ? (
                  <>
                    <svg className="w-3 h-3 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-600">Consider consulting a doctor</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Normal range</span>
                  </>
                )}
              </div>
            )
          }
        />
      </div>
      
      {fertilityStatus && (
        <div className={`p-4 rounded-lg ${fertilityStatus.color.replace('text-', 'bg-').replace('-800', '-100')} border border-${fertilityStatus.color.replace('text-', '').replace('-800', '-300')}`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-pink-800">{fertilityStatus.status} Tips</h4>
              <p className="text-sm text-pink-700">
                {fertilityStatus.status === 'Ovulation Day' 
                  ? 'Today is your most fertile day! Track your basal body temperature for best results.'
                  : 'You\'re in your fertile window. Consider tracking cervical mucus and basal body temperature.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get cycle phase
export const getCyclePhase = (day: number, cycleLength: number) => {
  const phaseLengths = {
    menstrual: Math.max(1, Math.round(cycleLength * 0.18)),
    follicular: Math.max(1, Math.round(cycleLength * 0.32)),
    ovulation: Math.max(1, Math.round(cycleLength * 0.11)),
  };

  if (day <= phaseLengths.menstrual) return { name: 'Menstrual', color: 'bg-pink-100 text-pink-800' };
  if (day <= phaseLengths.menstrual + phaseLengths.follicular)
    return { name: 'Follicular', color: 'bg-blue-100 text-blue-800' };
  if (day <= phaseLengths.menstrual + phaseLengths.follicular + phaseLengths.ovulation)
    return { name: 'Ovulation', color: 'bg-purple-100 text-purple-800' };
  return { name: 'Luteal', color: 'bg-yellow-100 text-yellow-800' };
};
