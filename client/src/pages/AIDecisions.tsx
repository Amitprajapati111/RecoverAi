import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../api/client';

export const AIDecisions: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/decisions');
      setDecisions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load AI decisions:', err);
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
            AI Decision Center
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-200">
              Deterministic Output Logs
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Structured JSON outputs, model versioning, explainability factors, and guardrail policy validations.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchDecisions} isLoading={loading}>
          Refresh
        </Button>
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
            Loading AI decision records...
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No AI decisions recorded yet. Run the Simulator or a Winning Demo to see live decision logs!
          </div>
        ) : (
          decisions.map((d) => {
            const dec = d.decision || {};
            const probPct = Math.round((dec.recoveryProbability || 0) * 100);

            return (
              <div key={d._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {dec.recommendedAction?.replace(/_/g, ' ') || 'CREATE PAYMENT LINK'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Model: <span className="font-mono">{d.model}</span> • Latency: {d.latencyMs || 240}ms
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={d.policyResult?.approved ? 'success' : 'danger'}>
                      {d.policyResult?.approved ? 'Policy: Approved' : 'Policy: Blocked'}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      Prob: {probPct}%
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900">Reasoning: </span>
                    {dec.reason || d.reasoning}
                  </div>

                  {dec.decisionFactors && dec.decisionFactors.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Decision Factors:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                        {dec.decisionFactors.map((factor: string, i: number) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
