import React from 'react';
import Link from 'next/link';
import { DefaultIcon } from '../page';

interface ActionLinkProps {
  href: string;
  title: string;
  bg?: string;
}

const ActionLink: React.FC<ActionLinkProps> = ({ href, title, bg = 'pink' }) => {
  const bgColor = 
    bg === 'purple' 
      ? 'bg-purple-50 hover:bg-purple-100' 
      : bg === 'blue' 
      ? 'bg-blue-50 hover:bg-blue-100' 
      : bg === 'green' 
      ? 'bg-green-50 hover:bg-green-100' 
      : 'bg-pink-50 hover:bg-pink-100';
      
  const innerBg = 
    bg === 'purple' 
      ? 'bg-purple-100 text-purple-600' 
      : bg === 'blue' 
      ? 'bg-blue-100 text-blue-600' 
      : bg === 'green' 
      ? 'bg-green-100 text-green-600' 
      : 'bg-pink-100 text-pink-600';

  return (
    <Link href={href} className={`p-3 ${bgColor} rounded-lg transition-colors text-center`}>
      <div className={`mx-auto w-8 h-8 ${innerBg} rounded-full flex items-center justify-center mb-1`}>
        <DefaultIcon />
      </div>
      <span className="text-xs font-medium text-gray-700">{title}</span>
    </Link>
  );
};

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <ActionLink href="/health-log" title="Log Health" bg="pink" />
          <ActionLink href="/cycle-tracking" title="Track Cycle" bg="purple" />
          <ActionLink href="/education" title="Learn" bg="blue" />
          <ActionLink href="/profile" title="Profile" bg="green" />
        </div>
      </div>
    </div>
  );
};
