'use client';

import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export const MostDayActiveChart: React.FC = () => {
  const [activeDay, setActiveDay] = useState<string>('Tue');

  const days = [
    { day: 'Sun', value: 45, displayVal: '4.210' },
    { day: 'Mon', value: 35, displayVal: '3.120' },
    { day: 'Tue', value: 85, displayVal: '8.162', isPeak: true },
    { day: 'Wed', value: 40, displayVal: '3.980' },
    { day: 'Thu', value: 30, displayVal: '2.840' },
    { day: 'Fri', value: 50, displayVal: '4.670' },
    { day: 'Sat', value: 55, displayVal: '5.100' },
  ];

  return (
    <div className="shopeers-card p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-content-secondary tracking-tight">
          Most Day Active
        </span>
        <button
          className="p-1 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-colors"
          title="Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Bar Chart Container */}
      <div className="h-44 flex items-end justify-between gap-2 pt-6 px-1">
        {days.map((item) => {
          const isSelected = activeDay === item.day;
          return (
            <div
              key={item.day}
              onClick={() => setActiveDay(item.day)}
              className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
            >
              {/* Highlight Value Floating Tag */}
              <div className="h-5 flex items-center justify-center">
                {isSelected ? (
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono animate-in fade-in zoom-in-75 duration-150">
                    {item.displayVal}
                  </span>
                ) : (
                  <span className="text-[10px] text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {item.displayVal}
                  </span>
                )}
              </div>

              {/* Rounded Bar Pill */}
              <div className="w-full flex justify-center">
                <div
                  style={{ height: `${item.value * 1.2}px` }}
                  className={`w-7 sm:w-8 rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-blue-600 dark:bg-blue-500 shadow-md shadow-blue-500/30'
                      : 'bg-surface-subtle group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                  }`}
                />
              </div>

              {/* Day Label */}
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-content-tertiary group-hover:text-content-secondary'
                }`}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
