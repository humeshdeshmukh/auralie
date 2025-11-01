import React from 'react';
import { format } from 'date-fns';
import { DefaultIcon } from '../page';

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard = React.memo<StatCardProps>(({ title, value }) => (
  <div className="bg-white overflow-hidden shadow rounded-xl p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center">
      <div className="flex-shrink-0 bg-pink-100 rounded-lg p-3">
        <DefaultIcon />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
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
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  cycleDay,
  nextPeriod,
  cycleLength,
  periodLength,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard title="Cycle Day" value={`${cycleDay}`} />
      <StatCard 
        title="Next Period" 
        value={nextPeriod ? format(new Date(nextPeriod), 'MMM d') : '--'} 
      />
      <StatCard title="Cycle Length" value={`${cycleLength} days`} />
      <StatCard title="Period Length" value={`${periodLength} days`} />
    </div>
  );
};
