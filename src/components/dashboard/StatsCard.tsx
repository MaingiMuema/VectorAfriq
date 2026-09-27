/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { IconType } from 'react-icons';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUpward: boolean;
  };
  description?: string;
}

export default function StatsCard({ title, value, icon, trend, description }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-[#468AD1]/10 rounded-lg">
          {icon}
        </div>
      </div>
      {(trend || description) && (
        <div className="flex items-center text-sm">
          {trend && (
            <span className={`flex items-center ${trend.isUpward ? 'text-green-500' : 'text-red-500'} mr-2`}>
              {trend.isUpward ? '↑' : '↓'} {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-gray-500">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
