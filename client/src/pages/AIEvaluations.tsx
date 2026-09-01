import React, { useEffect, useState } from 'react';
import { ShieldCheck, Target, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import api from '../api/client';

export const AIEvaluations: React.FC = () => {
  const [evals, setEvals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/evaluations');
      setEvals(res.data.data);
    } catch (err) {
      console.error('Failed to load AI evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = evals?.metrics || {
    recoveryPrecision: '78.4%',
    recoveryRecall: '71.2%',
    falsePositiveRate: '8.6%',
    averageConfidence: '84.2%',
    successfulRecoveryRate: '63.4%',
    aiActionAcceptanceRate: '88.7%',
    humanOverrideRate: '11.3%',
    totalEvaluatedDecisions: 1842,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            AI Model Evaluations & Benchmarks
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              SIMULATED DATA
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Performance precision, recall, false positive rates, and human override benchmarks across AI recovery decisions.
          </p>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total Decisions Evaluated: {metrics.totalEvaluatedDecisions?.toLocaleString()}
        </span>
      </div>

      {/* Primary Eval Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Recovery Precision"
          value={metrics.recoveryPrecision}
          subvalue="True positive recovery rate"
          badge="High Reliability"
          icon={Target}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <MetricCard
          title="Recovery Recall"
          value={metrics.recoveryRecall}
          subvalue="Coverage of recoverable cases"
          icon={ShieldCheck}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />

        <MetricCard
          title="False Positive Rate"
          value={metrics.falsePositiveRate}
          subvalue="Unwarranted interventions"
          icon={AlertCircle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <MetricCard
          title="Human Override Rate"
          value={metrics.humanOverrideRate}
          subvalue="Escalated actions adjusted"
          icon={BarChart2}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Safety and Governance Architecture Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          AI Governance & Safe Intervention Guarantees
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">Zero Unrestricted Money Actions</div>
            <p className="text-slate-600 leading-relaxed">
              LLMs only produce structured JSON recommendations. Execution is strictly routed through deterministic guardrails and typed Razorpay adapters.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">Automatic Fallback & Fail-Safe</div>
            <p className="text-slate-600 leading-relaxed">
              If an external AI provider experiences latency or outages, the system automatically falls back to rule-based deterministic scoring. Never fails open.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">Privacy & PII Sanitization</div>
            <p className="text-slate-600 leading-relaxed">
              Sensitive financial credentials (card CVV, full account numbers, Razorpay secrets) are never included in prompts or logged into AI decision records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
