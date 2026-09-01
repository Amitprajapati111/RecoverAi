import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, ArrowLeft, RefreshCw, CreditCard, RotateCcw, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../api/client';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load customer:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-sky-500" />
        Loading customer profile...
      </div>
    );
  }

  const customer = data?.customer;
  const payments = data?.payments || [];
  const recoveryCases = data?.recoveryCases || [];

  const formatAmount = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Link to="/customers">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Customers
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{customer?.name}</h1>
          <p className="text-xs text-slate-500">{customer?.email} • {customer?.phone || 'No phone recorded'}</p>
        </div>
      </div>

      {/* Customer Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-semibold">Customer Segment</div>
          <div className="mt-1">
            <Badge variant="purple" size="md">{customer?.customerSegment}</Badge>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-semibold">Recovery Score</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{customer?.recoveryScore} / 100</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-semibold">Lifetime Revenue</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatAmount(customer?.totalRevenue || 0)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-semibold">Payment History</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {customer?.successfulPayments} / {customer?.totalPayments}
            <span className="text-xs font-normal text-slate-400 ml-1.5">successful</span>
          </div>
        </div>
      </div>

      {/* Payments History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Payment History ({payments.length})
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          {payments.map((p: any) => (
            <div key={p._id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">
                  {formatAmount(p.amount)} • <span className="uppercase text-slate-500">{p.method}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(p.createdAt).toLocaleDateString()} • {p.failureReason || 'Success'}
                </div>
              </div>
              <Badge variant={p.status === 'captured' ? 'success' : 'danger'} size="sm">
                {p.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
