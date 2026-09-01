import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Users,
  Brain,
  CheckCircle2,
  Megaphone,
  BarChart3,
  ScrollText,
  FlaskConical,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Revenue At Risk', path: '/at-risk', icon: AlertTriangle, badge: 'Active' },
      ],
    },
    {
      title: 'REVENUE RECOVERY',
      items: [
        { name: 'Recovery Cases', path: '/recovery-cases', icon: RotateCcw },
        { name: 'Approvals Queue', path: '/approvals', icon: CheckCircle2, badge: 'Escalated' },
        { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
      ],
    },
    {
      title: 'PAYMENTS & CUSTOMERS',
      items: [
        { name: 'All Payments', path: '/payments', icon: CreditCard },
        { name: 'Failed Payments', path: '/failed-payments', icon: AlertTriangle },
        { name: 'Customers', path: '/customers', icon: Users },
      ],
    },
    {
      title: 'AI ENGINE & AUDIT',
      items: [
        { name: 'AI Decision Center', path: '/ai-decisions', icon: Brain },
        { name: 'AI Evaluations', path: '/ai-evaluations', icon: ShieldCheck },
        { name: 'Analytics & A/B', path: '/analytics', icon: BarChart3 },
        { name: 'Audit Trail', path: '/audit-logs', icon: ScrollText },
      ],
    },
    {
      title: 'HACKATHON DEMO',
      items: [
        { name: 'Demo Simulator', path: '/simulator', icon: FlaskConical, highlight: true },
        { name: 'Settings & Razorpay', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-md mr-3">
          <RotateCcw className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white tracking-tight flex items-center text-base">
            Recover<span className="text-sky-400">AI</span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
              PROD
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Razorpay Orchestrator</p>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all',
                        isActive
                          ? 'bg-sky-600/15 text-sky-400 font-semibold border-l-2 border-sky-400 pl-2.5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                        item.highlight && !isActive && 'text-amber-300 hover:text-amber-200 bg-amber-500/10'
                      )
                    }
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-800 text-slate-400 rounded">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* AI Loop Badge bottom */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] text-slate-300 font-medium">Autonomous Loop</span>
          </div>
          <span className="text-[10px] text-sky-400 font-semibold">Active</span>
        </div>
      </div>
    </aside>
  );
};
