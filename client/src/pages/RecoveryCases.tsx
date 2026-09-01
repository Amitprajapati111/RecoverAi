import React, { useEffect, useState } from 'react';
import { RotateCcw, Filter, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import api from '../api/client';

export const RecoveryCases: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchCases();
  }, [filterStatus]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'ALL' ? '/recovery/cases' : `/recovery/cases?status=${filterStatus}`;
      const res = await api.get(url);
      setCases(res.data.data || []);
    } catch (err) {
      console.error('Failed to load recovery cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Recovery Cases Pipeline
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-200">
              Closed-Loop Orchestration
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete lifecycle tracking of all failed payment interventions from diagnosis to settlement.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {['ALL', 'RECOVERED', 'IN_RECOVERY', 'ESCALATED', 'STOPPED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                filterStatus === st
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount At Risk</th>
                <th className="py-3.5 px-4">AI Probability</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                    Loading recovery cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No recovery cases found for status "{filterStatus}".
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const probPct = Math.round((c.recoveryProbability || 0) * 100);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {c._id.slice(-8)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.customerId?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{c.customerId?.email || 'email@example.com'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatAmount(c.amountAtRisk)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {probPct > 0 ? `${probPct}%` : 'Pending'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {c.currentStage || 'CREATED'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.attemptCount} / {c.maxAttempts}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            c.status === 'RECOVERED'
                              ? 'success'
                              : c.status === 'IN_RECOVERY' || c.status === 'RECOVERABLE'
                              ? 'info'
                              : c.status === 'ESCALATED'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/recovery-cases/${c._id}`}>
                          <Button variant="ghost" size="sm" icon={Eye}>
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
