import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../api/client';

export const Approvals: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals/pending');
      setCases(res.data.data || []);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(`approve_${id}`);
      await api.post(`/recovery/cases/${id}/approve`);
      await fetchPendingApprovals();
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(`reject_${id}`);
      await api.post(`/recovery/cases/${id}/reject`, { reason: 'Rejected by merchant reviewer' });
      await fetchPendingApprovals();
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatAmount = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Human Approval Center
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              High-Risk / High-Value Gate
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cases flagged by the policy engine for mandatory human oversight before Razorpay recovery workflows execute.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchPendingApprovals} isLoading={loading}>
          Refresh Queue
        </Button>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
            Loading approval queue...
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-semibold text-slate-800 text-sm">All clear! No pending human approvals.</div>
            <p className="text-slate-400 mt-1">
              High-value payments (&gt; ₹10,000) or low-confidence AI predictions will appear here for review.
            </p>
          </div>
        ) : (
          cases.map((c) => {
            const isApproving = actionLoading === `approve_${c._id}`;
            const isRejecting = actionLoading === `reject_${c._id}`;

            return (
              <div key={c._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-base">{formatAmount(c.amountAtRisk)}</span>
                      <Badge variant="danger" size="sm">Escalated</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Customer: <span className="font-semibold text-slate-700">{c.customerId?.name || 'High-Value Customer'}</span> ({c.customerId?.email || 'email@example.com'})
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={XCircle}
                      onClick={() => handleReject(c._id)}
                      isLoading={isRejecting}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => handleApprove(c._id)}
                      isLoading={isApproving}
                    >
                      Approve & Execute
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="font-semibold text-slate-700">AI Recommended Action: </span>
                    <span className="font-bold text-sky-700">{c.recommendedAction?.replace(/_/g, ' ') || 'CREATE PAYMENT LINK'}</span>
                    <div className="text-slate-500 mt-1">
                      Probability: <span className="font-bold text-emerald-600">{Math.round((c.recoveryProbability || 0) * 100)}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="font-semibold text-slate-700">Escalation Reason: </span>
                    <p className="text-slate-600 mt-0.5">
                      {c.amountAtRisk > 1000000
                        ? 'High-value transaction exceeds automated threshold (₹10,000). Requires human confirmation.'
                        : c.reasoning || 'Flagged for human review.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
