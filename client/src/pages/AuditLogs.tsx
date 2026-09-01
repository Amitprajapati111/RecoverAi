import React, { useEffect, useState } from 'react';
import { ScrollText, ShieldCheck, RefreshCw, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../api/client';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, [actorFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = actorFilter === 'ALL' ? '/audit-logs' : `/audit-logs?actorType=${actorFilter}`;
      const res = await api.get(url);
      setLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Immutable Audit Trail
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Tamper-Evident
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all AI decisions, merchant policy checks, user approvals, and Razorpay webhook settlements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {['ALL', 'AI', 'USER', 'SYSTEM', 'RAZORPAY'].map((actor) => (
            <button
              key={actor}
              onClick={() => setActorFilter(actor)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                actorFilter === actor
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {actor}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor Type</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Entity Target</th>
                <th className="py-3.5 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          log.actorType === 'AI'
                            ? 'info'
                            : log.actorType === 'RAZORPAY'
                            ? 'success'
                            : log.actorType === 'USER'
                            ? 'purple'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {log.actorType}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {log.entityType} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-md truncate font-mono text-[11px]">
                      {log.after ? JSON.stringify(log.after) : log.reason || 'Executed'}
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
