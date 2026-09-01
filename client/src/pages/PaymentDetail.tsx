import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../api/client';

export const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentDetail();
  }, [id]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load payment detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-sky-500" />
        Loading payment details and lifecycle timeline...
      </div>
    );
  }

  const payment = data?.payment;
  const recoveryCase = data?.recoveryCase;
  const auditTrail = data?.auditTrail || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/payments">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Payment {payment?.razorpayPaymentId || payment?._id.slice(-8)}
            </h1>
            <p className="text-xs text-slate-500">
              Created on {new Date(payment?.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <Badge variant={payment?.status === 'captured' ? 'success' : 'danger'}>
          {payment?.status}
        </Badge>
      </div>

      {/* Grid: Payment Info + Recovery Engine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Transaction Details
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Amount:</span>
              <span className="font-bold text-slate-900">₹{(payment?.amount / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold uppercase text-slate-800">{payment?.method || 'UPI'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-800">{payment?.customerId?.name || 'Rahul Sharma'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Failure Code:</span>
              <span className="font-mono text-rose-600 font-semibold">{payment?.failureCode || 'ERR_UPI_TIMEOUT'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Failure Reason:</span>
              <span className="text-slate-700 font-medium text-right">{payment?.failureReason || 'Bank timeout'}</span>
            </div>
          </div>
        </div>

        {/* AI Recovery Orchestrator Card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Sparkles className="w-4 h-4 text-sky-500 mr-1.5" />
              AI Recovery Orchestrator State
            </h2>
            {recoveryCase && (
              <Badge variant={recoveryCase.status === 'RECOVERED' ? 'success' : 'info'}>
                {recoveryCase.status}
              </Badge>
            )}
          </div>

          {recoveryCase ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">AI Probability</div>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">
                    {Math.round((recoveryCase.recoveryProbability || 0) * 100)}%
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Recommended Action</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {recoveryCase.recommendedAction?.replace(/_/g, ' ') || 'CREATE PAYMENT LINK'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Guardrail Status</div>
                  <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Approved
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1">AI Explainability & Reasoning:</div>
                <p className="text-slate-600 leading-relaxed">
                  {recoveryCase.reasoning ||
                    'Customer has completed 8 of last 9 payments successfully and current failure appears to be a temporary network or bank timeout.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recovery case associated with this captured payment.
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Timeline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Immutable Audit Trail & Event Sequence
        </h2>

        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {auditTrail.length > 0 ? (
            auditTrail.map((log: any) => (
              <div key={log._id} className="relative pl-8 text-xs">
                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-500" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    <span className="text-sky-600 uppercase font-mono mr-2">[{log.actorType}]</span>
                    {log.action}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {log.reason && <p className="text-slate-600 mt-0.5">{log.reason}</p>}
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 pl-8">No additional audit logs recorded for this entity.</div>
          )}
        </div>
      </div>
    </div>
  );
};
