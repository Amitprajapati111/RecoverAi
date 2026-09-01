import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const statusStepOrder = ['NEW', 'ANALYZING', 'RECOVERABLE', 'IN_RECOVERY', 'RECOVERED'];

export const RecoveryCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCase();
    }
  }, [id]);

  const fetchCase = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recovery/cases/${id}`);
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to load recovery case:', error);
    } finally {
      setLoading(false);
    }
  };

  const recoveryCase = data?.recoveryCase;
  const payment = recoveryCase?.paymentId || {};
  const customer = recoveryCase?.customerId || {};
  const aiDecision = recoveryCase?.aiDecisionId || {};
  const attempts = data?.attempts || [];
  const auditTrail = data?.auditTrail || [];
  const latestAttempt = attempts[0];

  const policyResult = aiDecision?.policyResult || {};

  const currentStepIndex = useMemo(() => {
    const index = statusStepOrder.indexOf(recoveryCase?.status);
    return index === -1 ? 0 : index;
  }, [recoveryCase?.status]);

  const copyPaymentLink = async () => {
    if (latestAttempt?.paymentLinkUrl) {
      await navigator.clipboard.writeText(latestAttempt.paymentLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const runAnalysis = async () => {
    try {
      setActionLoading('analyze');
      await api.post(`/recovery/cases/${id}/analyze`);
      await fetchCase();
    } finally {
      setActionLoading(null);
    }
  };

  const approveRecovery = async () => {
    try {
      setActionLoading('approve');
      await api.post(`/recovery/cases/${id}/approve`);
      await fetchCase();
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRecovery = async () => {
    try {
      setActionLoading('reject');
      await api.post(`/recovery/cases/${id}/reject`, { reason: 'Rejected from demo screen' });
      await fetchCase();
    } finally {
      setActionLoading(null);
    }
  };

  const simulateRecoveryPayment = async () => {
    try {
      setActionLoading('capture');
      await api.post('/simulator/demo/payment/success', { paymentId: payment?._id || recoveryCase?.paymentId?._id });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await fetchCase();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2" />
        Loading recovery case...
      </div>
    );
  }

  if (!recoveryCase) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-slate-900">Recovery case not found</h1>
        <p className="text-sm text-slate-500 mt-1">The case may not exist or you may not have access.</p>
      </div>
    );
  }

  const probability = Math.round((recoveryCase.recoveryProbability || 0) * 100);
  const metricColor = probability >= 75 ? 'text-emerald-600' : probability >= 55 ? 'text-amber-600' : 'text-rose-600';
  const statusVariant =
    recoveryCase.status === 'RECOVERED'
      ? 'success'
      : recoveryCase.status === 'ESCALATED'
      ? 'warning'
      : recoveryCase.status === 'STOPPED' || recoveryCase.status === 'NOT_RECOVERABLE'
      ? 'danger'
      : 'info';

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-900 flex items-center justify-between">
        <span className="font-semibold">TEST MODE — No real money is transferred.</span>
        <span className="font-medium">AI recommends. Policy Engine authorizes.</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/recovery-cases">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Recovery Case #{String(recoveryCase._id).slice(-8)}
              {recoveryCase.isSimulated && (
                <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">Demo</span>
              )}
            </h1>
            <p className="text-sm text-slate-500">Central recovery lifecycle screen for the demo story.</p>
          </div>
        </div>
        <Badge variant={statusVariant as any}>{recoveryCase.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Case Snapshot</h2>
            <span className="text-[11px] text-slate-400">Amount at risk</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-semibold text-slate-900">{customer.name || 'Rahul Sharma'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-slate-900">₹{((recoveryCase.amountAtRisk || 0) / 100).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Risk</span><span className={`font-semibold ${metricColor}`}>{recoveryCase.riskLevel || 'MEDIUM'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Attempts</span><span className="font-semibold text-slate-900">{recoveryCase.attemptCount} / {recoveryCase.maxAttempts}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Failure</span><span className="font-semibold text-slate-900">{payment.failureType || 'INSUFFICIENT_FUNDS'}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-sky-500" /> AI Analysis</h2>
            <Button variant="secondary" size="sm" icon={Brain} onClick={runAnalysis} isLoading={actionLoading === 'analyze'}>
              Analyze with AI
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Recovery Probability</div>
              <div className={`mt-1 text-xl font-bold ${metricColor}`}>{probability}%</div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${probability}%` }} /></div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Recommended Action</div>
              <div className="mt-1 font-semibold text-slate-900">{recoveryCase.recommendedAction || 'CREATE_PAYMENT_LINK'}</div>
              <div className="mt-1 text-xs text-slate-500">AI recommends. Policy Engine authorizes.</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Confidence</div>
              <div className="mt-1 font-semibold text-slate-900">{aiDecision.confidence ? `${Math.round(aiDecision.confidence * 100)}%` : 'High'}</div>
              <div className="mt-1 text-xs text-slate-500">{aiDecision.reasoning || recoveryCase.reasoning || 'Recoverable failure with strong customer history.'}</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-700">Policy Evaluation</div>
              <Badge variant={policyResult.approved ? 'success' : policyResult.requiresHumanApproval ? 'warning' : 'danger'}>
                {policyResult.approved ? 'APPROVED' : policyResult.requiresHumanApproval ? 'HUMAN APPROVAL' : 'BLOCKED'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div>Minimum recovery probability: <span className="font-semibold">55%</span></div>
              <div>Approval threshold: <span className="font-semibold">₹10,000</span></div>
              <div>Attempt limit: <span className="font-semibold">{recoveryCase.maxAttempts}</span></div>
              <div>Action allowed: <span className="font-semibold">{recoveryCase.recommendedAction || 'CREATE_PAYMENT_LINK'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Recovery Timeline</h2>
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchCase}>Refresh</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusStepOrder.map((step, index) => (
                <div key={step} className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs ${index <= currentStepIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  <span className="font-semibold">{index <= currentStepIndex ? '✓' : '•'}</span>
                  <span>{step}</span>
                </div>
              ))}
              {recoveryCase.status === 'ESCALATED' && <div className="flex items-center gap-2 px-3 py-2 rounded-full border text-xs bg-amber-50 border-amber-200 text-amber-700"><ShieldAlert className="w-3.5 h-3.5" />ESCALATED</div>}
              {recoveryCase.status === 'STOPPED' && <div className="flex items-center gap-2 px-3 py-2 rounded-full border text-xs bg-rose-50 border-rose-200 text-rose-700"><ShieldAlert className="w-3.5 h-3.5" />STOPPED</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Recovery Action</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Action</div>
                <div className="mt-1 font-semibold text-slate-900">{latestAttempt?.action || recoveryCase.selectedAction || recoveryCase.recommendedAction || 'CREATE_PAYMENT_LINK'}</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Status</div>
                <div className="mt-1 font-semibold text-slate-900">{latestAttempt?.status || recoveryCase.currentStage || 'PENDING'}</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Payment Link</div>
                <div className="mt-1 font-semibold text-slate-900 truncate">{latestAttempt?.paymentLinkUrl || 'Waiting for execution'}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={Copy} onClick={copyPaymentLink} disabled={!latestAttempt?.paymentLinkUrl}>
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
              <Button variant="primary" size="sm" icon={Play} onClick={simulateRecoveryPayment} isLoading={actionLoading === 'capture'} disabled={!payment?._id}>
                Simulate Successful Payment
              </Button>
              {recoveryCase.requiresHumanApproval && (
                <>
                  <Button variant="success" size="sm" icon={CheckCircle2} onClick={approveRecovery} isLoading={actionLoading === 'approve'}>
                    Approve Recovery
                  </Button>
                  <Button variant="danger" size="sm" icon={AlertTriangle} onClick={rejectRecovery} isLoading={actionLoading === 'reject'}>
                    Reject Recovery
                  </Button>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">Current stage: {recoveryCase.currentStage}. The recovery service executes actions; AI never talks directly to Razorpay.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Event Timeline</h2>
            <div className="space-y-3">
              {auditTrail.slice(0, 8).map((entry: any) => (
                <div key={entry._id} className="flex gap-3 text-xs">
                  <div className="mt-0.5 w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">{entry.actorType} · {entry.action}</div>
                    <div className="text-slate-500">{new Date(entry.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {!auditTrail.length && <div className="text-xs text-slate-400">No audit trail yet.</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Attempt History</h2>
            <div className="space-y-3">
              {attempts.map((attempt: any) => (
                <div key={attempt._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{attempt.action}</span>
                    <Badge variant={attempt.status === 'SUCCESS' ? 'success' : attempt.status === 'FAILED' ? 'danger' : 'neutral'} size="sm">{attempt.status}</Badge>
                  </div>
                  <div className="mt-1 text-slate-500">#{attempt.attemptNumber} · {new Date(attempt.createdAt).toLocaleString()}</div>
                  {attempt.paymentLinkUrl && <div className="mt-1 text-sky-700 truncate">{attempt.paymentLinkUrl}</div>}
                </div>
              ))}
              {!attempts.length && <div className="text-xs text-slate-400">No recovery attempts yet.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Customer & Payment Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div><div className="text-[10px] uppercase text-slate-400 font-semibold">Customer</div><div className="font-semibold text-slate-900">{customer.name || 'Rahul Sharma'}</div></div>
          <div><div className="text-[10px] uppercase text-slate-400 font-semibold">Email</div><div className="font-semibold text-slate-900">{customer.email || 'rahul.sharma@example.com'}</div></div>
          <div><div className="text-[10px] uppercase text-slate-400 font-semibold">Payment Method</div><div className="font-semibold text-slate-900">{payment.method || 'upi'}</div></div>
          <div><div className="text-[10px] uppercase text-slate-400 font-semibold">Payment ID</div><div className="font-mono text-slate-900 break-all">{payment.razorpayPaymentId || payment._id}</div></div>
        </div>
      </div>
    </div>
  );
};
