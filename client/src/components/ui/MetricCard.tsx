import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string;
  subvalue?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subvalue,
  change,
  isPositive = true,
  icon: Icon,
  iconBg = 'bg-sky-50',
  iconColor = 'text-sky-600',
  badge,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={clsx('w-5 h-5', iconColor)} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
          {subvalue && <div className="text-xs text-slate-400 mt-0.5">{subvalue}</div>}
        </div>
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            {badge}
          </span>
        )}
      </div>
      {change && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          <span className={clsx('font-medium mr-1.5', isPositive ? 'text-emerald-600' : 'text-rose-600')}>
            {change}
          </span>
          <span className="text-slate-400">vs previous period</span>
        </div>
      )}
    </div>
  );
};
