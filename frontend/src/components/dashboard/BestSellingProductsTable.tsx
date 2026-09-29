'use client';

import React from 'react';
import { MoreHorizontal, Star, Headphones, Watch, Smartphone, Dumbbell, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const BestSellingProductsTable: React.FC = () => {
  const items = [
    {
      id: '#83009',
      name: 'Hybrid Active Noise Cancelling Headset',
      category: 'Pro Gym Gear',
      sold: '2,310 sold',
      revenue: '$124.839',
      rating: '5.0',
      icon: Headphones,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      id: '#83001',
      name: 'Casio G-Shock Shock Resistant Watch',
      category: 'Workout Tracker',
      sold: '1,230 sold',
      revenue: '$92.662',
      rating: '4.8',
      icon: Watch,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: '#83004',
      name: 'SAMSUNG Galaxy S25 Ultra 5G Case',
      category: 'Mobile & Health App',
      sold: '812 sold',
      revenue: '$74.048',
      rating: '4.7',
      icon: Smartphone,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      id: '#83012',
      name: 'Gold Annual VIP Gym Pass & Personal Training',
      category: 'Annual Retention',
      sold: '468 sold',
      revenue: '$62.450',
      rating: '4.9',
      icon: Dumbbell,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="shopeers-card p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-content-primary tracking-tight">
            Best Selling Products &amp; Memberships
          </h3>
          <p className="text-[11px] text-content-tertiary">Top revenue-generating retainers</p>
        </div>
        <button
          className="p-1 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-colors"
          title="Table options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
              <th className="pb-3 pl-1 font-mono">ID</th>
              <th className="pb-3 pl-2">NAME</th>
              <th className="pb-3 text-right pr-4">SOLD</th>
              <th className="pb-3 text-right pr-4">REVENUE</th>
              <th className="pb-3 text-right pr-1">RATING</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-surface-subtle/50 transition-colors group">
                {/* ID */}
                <td className="py-3 pl-1 font-mono text-content-tertiary text-[11px]">
                  {row.id}
                </td>

                {/* Name & Icon */}
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${row.iconBg}`}
                    >
                      <row.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-content-primary truncate max-w-[200px] sm:max-w-xs">
                        {row.name}
                      </div>
                      <div className="text-[10px] text-content-tertiary">{row.category}</div>
                    </div>
                  </div>
                </td>

                {/* Sold */}
                <td className="py-3 text-right pr-4 text-content-secondary font-medium">
                  {row.sold}
                </td>

                {/* Revenue */}
                <td className="py-3 text-right pr-4 font-semibold text-content-primary font-mono">
                  {row.revenue}
                </td>

                {/* Rating with Yellow Star */}
                <td className="py-3 text-right pr-1">
                  <div className="inline-flex items-center gap-1 font-semibold text-content-primary">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>({row.rating})</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
