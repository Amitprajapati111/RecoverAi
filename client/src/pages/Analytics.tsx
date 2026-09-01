import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Sparkles, RefreshCw, Split } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import api from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const failureData = data?.failureBreakdown?.map((f: any) => ({
    name: f._id,
    count: f.count,
    amount: Math.round(f.totalAmount / 100),
  })) || [
    { name: 'UPI_TIMEOUT', count: 680, amount: 1699000 },
    { name: 'BANK_TIMEOUT', count: 420, amount: 1049000 },
    { name: 'INSUFFICIENT_FUNDS', count: 310, amount: 774000 },
    { name: 'CARD_DECLINED', count: 240, amount: 599000 },
    { name: 'CARD_EXPIRED', count: 192, amount: 480000 },
  ];

  const COLORS = ['#0284c7', '#38bdf8', '#818cf8', '#f59e0b', '#ef4444', '#10b981'];

  const strategies = data?.strategyComparison || [
    {
      strategy: 'Strategy A: Instant Payment Link (15 min delay)',
      recoveryRate: 64.2,
      avgRecoveryTime: '24 min',
      customerResponseRate: 78.5,
      revenueRecovered: 124500000,
      attempts: 420,
    },
    {
      strategy: 'Strategy B: Email Reminder + Method Update (30 min delay)',
      recoveryRate: 49.8,
      avgRecoveryTime: '1h 12m',
      customerResponseRate: 58.2,
      revenueRecovered: 68200000,
      attempts: 310,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Revenue Recovery Analytics & A/B Experiments
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Strategy Optimization
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze failure causes, recovery win rates, and compare A/B recovery strategies.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </button>
      </div>

      {/* A/B Experiment Comparison */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Split className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">A/B Recovery Strategy Benchmark</h2>
          </div>
          <Badge variant="purple">Active Multi-Arm Experiment</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strat: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div className="font-bold text-slate-900 text-sm max-w-xs">{strat.strategy}</div>
                {i === 0 && <Badge variant="success" size="sm">Winning (+14.4%)</Badge>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
                  <div className="text-base font-bold text-emerald-600">{strat.recoveryRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Avg Time</div>
                  <div className="text-base font-bold text-slate-900">{strat.avgRecoveryTime}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Response</div>
                  <div className="text-base font-bold text-sky-600">{strat.customerResponseRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Recovered</div>
                  <div className="text-base font-bold text-slate-900">
                    ₹{(strat.revenueRecovered / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Failure Breakdown Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Payment Failure Types Breakdown
        </h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={failureData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(value: any) => [Number(value).toLocaleString(), 'Failures']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]}>
                {failureData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
