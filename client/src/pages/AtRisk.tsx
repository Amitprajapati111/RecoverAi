import React, { useEffect, useState } from 'react';
import { AlertTriangle, Sparkles, Filter, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import api from '../api/client';

export const AtRisk: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAtRiskCases();
  }, []);

  const fetchAtRiskCases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recovery/cases?status=RECOVERABLE');
      if (res.data.data && res.data.data.length > 0) {
        setCases(res.data.data);
      } else {
        // Fetch all non-recovered cases
        const allRes = await api.get('/recovery/cases');
        setCases(allRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load at-risk cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAnalysis = async (caseId: string) => {
    try {
      setAnalyzingId(caseId);
      await api.post(`/recovery/cases/${caseId}/analyze`);
      await fetchAtRiskCases();
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatAmount = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Revenue At Risk
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              Active Interventions
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline of failed transactions requiring AI diagnosis or executing bounded recovery workflows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAtRiskCases} isLoading={loading}>
            Refresh
          </Button>
          <Link to="/simulator">
            <Button variant="primary" size="sm" icon={Sparkles}>
              Simulate Failures
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Failure Reason</th>
                <th className="py-3.5 px-4">Recovery Probability</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Recommended Action</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                    Loading at-risk cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                    No active payments at risk. Use the Simulator to generate synthetic transactions!
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const probPct = Math.round((c.recoveryProbability || 0) * 100);
                  const isAnalyzing = analyzingId === c._id;

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.customerId?.name || 'Rahul Sharma'}</div>
                        <div className="text-[11px] text-slate-400">{c.customerId?.email || 'customer@example.com'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatAmount(c.amountAtRisk)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{c.paymentId?.failureType || 'UPI_TIMEOUT'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {c.paymentId?.failureReason || 'Transaction timed out'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${probPct}%`,
                                backgroundColor: probPct > 70 ? '#10b981' : probPct > 40 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="font-semibold text-slate-700">{probPct}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            c.priority === 'CRITICAL' || c.priority === 'HIGH'
                              ? 'danger'
                              : c.priority === 'MEDIUM'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {c.priority || 'HIGH'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">
                          {c.recommendedAction?.replace(/_/g, ' ') || 'CREATE PAYMENT LINK'}
                        </span>
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
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Sparkles}
                            isLoading={isAnalyzing}
                            onClick={() => handleTriggerAnalysis(c._id)}
                            className="text-sky-700 border-sky-200 bg-sky-50/50 hover:bg-sky-100"
                          >
                            Re-Analyze
                          </Button>
                          <Link to={`/recovery-cases/${c._id}`}>
                            <Button variant="ghost" size="sm">
                              View →
                            </Button>
                          </Link>
                        </div>
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
