import React, { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import api from '../api/client';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${search}`);
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Intelligence</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical recovery scores, lifetime values, and customer behavior segments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name/email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchCustomers} isLoading={loading}>
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
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Segment</th>
                <th className="py-3.5 px-4">Recovery Score</th>
                <th className="py-3.5 px-4">Success / Total</th>
                <th className="py-3.5 px-4">Success Rate</th>
                <th className="py-3.5 px-4">Total Revenue</th>
                <th className="py-3.5 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No customers found. Run the Simulator to generate synthetic merchant customers!
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const rate = c.totalPayments > 0 ? Math.round((c.successfulPayments / c.totalPayments) * 100) : 0;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            c.customerSegment === 'LOYAL'
                              ? 'success'
                              : c.customerSegment === 'HIGH_VALUE'
                              ? 'purple'
                              : 'info'
                          }
                          size="sm"
                        >
                          {c.customerSegment}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{c.recoveryScore}/100</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {c.successfulPayments} / {c.totalPayments}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        {rate}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatAmount(c.totalRevenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/customers/${c._id}`}>
                          <Button variant="ghost" size="sm" icon={Eye}>
                            Profile
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
