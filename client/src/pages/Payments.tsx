import React, { useEffect, useState } from 'react';
import { CreditCard, Search, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import api from '../api/client';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [search]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments?search=${search}`);
      setPayments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            All merchant transactions received via Razorpay webhooks or simulated payment stream.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search payment/order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchPayments} isLoading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Razorpay ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Failure Reason</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No payments found. Use the Simulator to generate synthetic transactions!
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {p.razorpayPaymentId || p._id.slice(-8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.customerId?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400">{p.customerId?.email || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatAmount(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-slate-600 font-medium">
                      {p.method || 'UPI'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === 'captured' ? 'success' : 'danger'} size="sm">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">
                      {p.failureReason || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/payments/${p._id}`}>
                        <Button variant="ghost" size="sm" icon={Eye}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
