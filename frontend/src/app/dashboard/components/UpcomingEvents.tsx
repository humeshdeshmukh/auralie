import React from 'react';
import { format, isToday } from 'date-fns';
import Link from 'next/link';

interface EventItem {
  date: string;
  title: string;
  icon: string;
  color: string;
}

interface UpcomingEventsProps {
  events: EventItem[];
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming</h3>
          <p className="text-sm text-gray-500">No upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming</h3>
        <div className="space-y-4">
          {events.map((event, index) => (
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
  );
};
