import React from 'react';

interface WelcomeHeaderProps {
  userName: string;
  cyclePhase: {
    name: string;
    color: string;
  };
  cycleDay: number;
  cycleLength: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  userName,
  cyclePhase,
  cycleDay,
  cycleLength,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back, {userName} 👋</h2>
          <p className="text-gray-600">Here&apos;s what&apos;s happening with your health today.</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cyclePhase.color} mr-2`}>
            {cyclePhase.name} Phase
          </span>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mr-2">
            Day {cycleDay} of {cycleLength}
          </span>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border text-sm shadow-sm hover:shadow-md"
            title="Refresh data"
          >
            {isRefreshing ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className="text-xs">Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17a8 8 0 0113-6.32L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs">Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
