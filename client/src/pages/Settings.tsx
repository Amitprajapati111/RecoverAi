import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Shield, Key, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../api/client';

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Settings state
  const [keyId, setKeyId] = useState('rzp_test_demo12345');
  const [keySecret, setKeySecret] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [requireApprovalAbove, setRequireApprovalAbove] = useState(10000);
  const [minProbability, setMinProbability] = useState(55);
  const [enableAI, setEnableAI] = useState(true);
  const [enableHinglish, setEnableHinglish] = useState(false);
  const [enablePaymentLinks, setEnablePaymentLinks] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/merchants/profile');
      const m = res.data.data;
      if (m?.razorpayKeyId) setKeyId(m.razorpayKeyId);
      if (m?.recoverySettings) {
        setMaxAttempts(m.recoverySettings.maxAttempts || 3);
        setRequireApprovalAbove((m.recoverySettings.requireApprovalAboveAmount || 1000000) / 100);
        setMinProbability((m.recoverySettings.minimumRecoveryProbability || 0.55) * 100);
      }
      if (m?.featureFlags) {
        setEnableAI(m.featureFlags.enableAI ?? true);
        setEnableHinglish(m.featureFlags.enableHinglish ?? false);
        setEnablePaymentLinks(m.featureFlags.enablePaymentLinks ?? true);
      }
    } catch (err) {
      console.error('Failed to load merchant profile:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSuccess(false);

      if (keySecret) {
        await api.post('/merchants/razorpay-credentials', {
          razorpayKeyId: keyId,
          razorpayKeySecret: keySecret,
          razorpayEnvironment: 'test',
        });
      }

      await api.put('/merchants/profile', {
        recoverySettings: {
          maxAttempts,
          requireApprovalAboveAmount: requireApprovalAbove * 100,
          minimumRecoveryProbability: minProbability / 100,
        },
        featureFlags: {
          enableAI,
          enableHinglish,
          enablePaymentLinks,
        },
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Merchant & Integration Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Configure Razorpay credentials, guardrails, and feature toggles.</p>
        </div>

        <Button variant="primary" size="sm" icon={Save} onClick={handleSave} isLoading={loading}>
          Save Changes
        </Button>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Settings updated and persisted securely.
        </div>
      )}

      {/* Razorpay Test Mode Credentials */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">Razorpay API Credentials (Test Mode)</h2>
          </div>
          <Badge variant="success">Test Mode Active</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Razorpay Key ID</label>
            <input
              type="text"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Razorpay Key Secret</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Guardrail Policy Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Deterministic Guardrail Policies</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Max Recovery Attempts</label>
            <input
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <span className="text-[10px] text-slate-400">Hard stop after max attempts</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Require Approval Above (₹)</label>
            <input
              type="number"
              value={requireApprovalAbove}
              onChange={(e) => setRequireApprovalAbove(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <span className="text-[10px] text-slate-400">Escalate to human queue</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Min Recovery Probability (%)</label>
            <input
              type="number"
              value={minProbability}
              onChange={(e) => setMinProbability(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <span className="text-[10px] text-slate-400">Skip recovery below this score</span>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Feature Flags</h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-slate-900">Enable Autonomous AI Scoring</span>
              <p className="text-slate-400 text-[11px]">Allow AI agent to diagnose failed payment causes</p>
            </div>
            <input
              type="checkbox"
              checked={enableAI}
              onChange={(e) => setEnableAI(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-slate-900">Enable Payment Links Creation</span>
              <p className="text-slate-400 text-[11px]">Generate direct Razorpay Payment Links for recovery</p>
            </div>
            <input
              type="checkbox"
              checked={enablePaymentLinks}
              onChange={(e) => setEnablePaymentLinks(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-slate-900">Enable Hinglish Customer Messaging</span>
              <p className="text-slate-400 text-[11px]">AI drafts localized WhatsApp / SMS in friendly Hinglish tone</p>
            </div>
            <input
              type="checkbox"
              checked={enableHinglish}
              onChange={(e) => setEnableHinglish(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
