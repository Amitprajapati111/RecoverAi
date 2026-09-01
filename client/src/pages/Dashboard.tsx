import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Brain,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Play,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {
    revenueAtRisk: 0,
    recoverableRevenue: 0,
    recoveredRevenue: 0,
    recoveryRate: 0,
    failedPayments: 0,
    aiActions: 0,
    humanEscalations: 0,
  };

  const funnelData = data?.funnel || [];

  const trendData = data?.trend?.length
    ? data.trend.map((t: any) => ({
        date: t._id,
        atRisk: Math.round(t.atRisk / 100),
        recovered: Math.round(t.recovered / 100),
      }))
    : [];

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)}L`;
    }
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Revenue Recovery Center
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-200">
              Live Autonomous Pipeline
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring of failed payment detection, AI scoring, policy evaluations, and recovered GMV.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/simulator">
            <Button variant="secondary" size="sm" icon={Sparkles}>
              Simulator Console
            </Button>
          </Link>
          <Link to="/at-risk">
            <Button variant="primary" size="sm" icon={ArrowUpRight}>
              View At-Risk Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue At Risk"
          value={formatRupees(kpis.revenueAtRisk)}
          subvalue={`${kpis.failedPayments.toLocaleString()} failed transactions`}
          change={kpis.revenueAtRiskChange ? `${kpis.revenueAtRiskChange > 0 ? '+' : ''}${kpis.revenueAtRiskChange}%` : undefined}
          isPositive={kpis.revenueAtRiskChange < 0}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <MetricCard
          title="Recoverable Revenue"
          value={formatRupees(kpis.recoverableRevenue)}
          subvalue="High-confidence AI candidates"
          badge="AI Qualified"
          icon={Brain}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />

        <MetricCard
          title="Revenue Recovered"
          value={formatRupees(kpis.recoveredRevenue)}
          subvalue="Directly settled via Razorpay"
          change={kpis.recoveredRevenueChange ? `${kpis.recoveredRevenueChange > 0 ? '+' : ''}${kpis.recoveredRevenueChange}%` : undefined}
          isPositive={kpis.recoveredRevenueChange > 0}
          icon={RotateCcw}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <MetricCard
          title="Recovery Rate"
          value={`${kpis.recoveryRate}%`}
          subvalue={`Avg Time: ${kpis.avgRecoveryTime?.formatted || 'N/A'}`}
          change={kpis.recoveryRateChange ? `${kpis.recoveryRateChange > 0 ? '+' : ''}${kpis.recoveryRateChange}%` : undefined}
          isPositive={kpis.recoveryRateChange > 0}
          icon={TrendingUp}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">AI Actions Executed</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{kpis.aiActions.toLocaleString()}</div>
          </div>
          <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded">Bounded Tools</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Human Escalations</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{kpis.humanEscalations.toLocaleString()}</div>
          </div>
          <Link to="/approvals" className="text-xs font-semibold text-amber-600 hover:underline">
            Review Queue →
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Average Recovery Time</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{kpis.avgRecoveryTime?.formatted || 'N/A'}</div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Fast Turnaround</span>
        </div>
      </div>

      {/* AI Evaluation Metrics */}
      {kpis.aiEvaluation && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">AI Evaluation Metrics</h3>
            <span className="text-[11px] text-slate-400">Model performance tracking</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] font-medium text-slate-400 uppercase mb-1">Recovery Precision</div>
              <div className="text-xl font-bold text-slate-900">{kpis.aiEvaluation.precision}%</div>
              <div className="text-[10px] text-slate-500 mt-1">True positive rate</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] font-medium text-slate-400 uppercase mb-1">Recovery Recall</div>
              <div className="text-xl font-bold text-slate-900">{kpis.aiEvaluation.recall}%</div>
              <div className="text-[10px] text-slate-500 mt-1">Coverage rate</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] font-medium text-slate-400 uppercase mb-1">False Positive Rate</div>
              <div className="text-xl font-bold text-slate-900">{kpis.aiEvaluation.falsePositiveRate}%</div>
              <div className="text-[10px] text-slate-500 mt-1">Unwarranted interventions</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] font-medium text-slate-400 uppercase mb-1">Human Override Rate</div>
              <div className="text-xl font-bold text-slate-900">{kpis.aiEvaluation.humanOverrideRate}%</div>
              <div className="text-[10px] text-slate-500 mt-1">Escalated adjustments</div>
            </div>
          </div>
        </div>
      )}

      {/* A/B Experiment Results */}
      {data?.abExperiments?.isActive && data.abExperiments.variants.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">A/B Recovery Strategy Benchmark</h3>
              <p className="text-[11px] text-slate-400">Active Multi-Arm Experiment</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              {data.abExperiments.winningVariant === data.abExperiments.variants[0]?.variant ? 'Winning' : 'Testing'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.abExperiments.variants.map((variant: any) => (
              <div
                key={variant.variant}
                className={`p-4 rounded-xl border ${
                  variant.variant === data.abExperiments.winningVariant
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-slate-5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-slate-900">{variant.variant}</div>
                  {variant.variant === data.abExperiments.winningVariant && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      +14.4% Winning
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 mb-1">Win Rate</div>
                    <div className="font-bold text-slate-900">{variant.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Avg Time</div>
                    <div className="font-bold text-slate-900">{variant.avgTime.formatted}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Response</div>
                    <div className="font-bold text-slate-900">
                      {variant.totalCases > 0 ? Math.round((variant.recoveredCases / variant.totalCases) * 100) : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Recovered</div>
                    <div className="font-bold text-slate-900">{formatRupees(variant.recoveredAmount)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section: Funnel & Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Revenue Recovery Funnel */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Revenue Recovery Funnel</h3>
            <span className="text-[11px] text-slate-400">Conversion across stages</span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-around">
            {funnelData.map((stage: any, idx: number) => {
              const maxVal = funnelData[0]?.count || 100000;
              const widthPct = Math.max(12, Math.round((stage.count / maxVal) * 100));

              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 flex items-center">
                      <span className="w-5 text-slate-400 text-[10px]">#{idx + 1}</span>
                      {stage.stage}
                    </span>
                    <span className="text-slate-900 font-bold">{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: stage.color || '#0284c7',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Recovery Trend Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recovery Trajectory</h3>
              <p className="text-[11px] text-slate-400">At Risk vs Successfully Recovered (in ₹)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" /> At Risk
              </span>
              <span className="flex items-center text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Recovered
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="atRisk"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAtRisk)"
                  name="At Risk"
                />
                <Area
                  type="monotone"
                  dataKey="recovered"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRecovered)"
                  name="Recovered"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Featured Quick Scenario: Winning Demo Highlight */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Sparkles className="w-3 h-3 mr-1" /> Hackathon Showcase Flow
          </div>
          <h2 className="text-lg font-bold">Scenario: Recover ₹4,999 Failed Payment (Rahul Sharma)</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Execute the complete end-to-end recovery loop: Failure Detection → AI Diagnosis (87% confidence) → Guardrail Approval → Razorpay Payment Link → Webhook Settlement → Revenue Recovered.
          </p>
        </div>

        <Link to="/simulator">
          <Button variant="primary" size="md" icon={Play} className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shrink-0">
            Launch Scenario
          </Button>
        </Link>
      </div>
    </div>
  );
};
