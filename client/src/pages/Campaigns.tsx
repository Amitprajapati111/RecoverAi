import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Power, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import api from '../api/client';

export const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minAmount, setMinAmount] = useState(2000);
  const [delay, setDelay] = useState(15);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campaigns');
      setCampaigns(res.data.data || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/campaigns/${id}/toggle`);
      await fetchCampaigns();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/campaigns', {
        name,
        description,
        triggerCondition: { minAmount: minAmount * 100, minRecoveryProbability: 0.65 },
        actions: [{ actionType: 'CREATE_PAYMENT_LINK', delayMinutes: delay }],
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      await fetchCampaigns();
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const formatAmount = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            Recovery Campaigns
            <span className="ml-2.5 px-2 py-0.5 text-xs font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-200">
              Custom Rule Workflows
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build automated recovery rules matching transaction amounts, customer segments, and channel preferences.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            No recovery campaigns created yet. Click "New Campaign" to start!
          </div>
        ) : (
          campaigns.map((camp) => (
            <div key={camp._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={camp.isActive ? 'success' : 'neutral'}>
                    {camp.isActive ? 'Active' : 'Paused'}
                  </Badge>
                  <button
                    onClick={() => handleToggle(camp._id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      camp.isActive ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-slate-400 bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{camp.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{camp.description || 'Automated recovery campaign'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="font-semibold text-slate-700">Trigger Conditions:</div>
                  <div>• Min Amount: {formatAmount(camp.triggerCondition?.minAmount || 0)}</div>
                  <div>• Action: {camp.actions?.[0]?.actionType?.replace(/_/g, ' ') || 'CREATE PAYMENT LINK'}</div>
                  <div>• Delay: {camp.actions?.[0]?.delayMinutes || 15} minutes</div>
                </div>
              </div>

              {/* Metrics */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Recovered</div>
                  <div className="font-bold text-emerald-600">
                    {formatAmount(camp.metrics?.recoveredRevenue || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
                  <div className="font-bold text-sky-600">
                    {camp.metrics?.recoveryRate || 68}%
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Campaign Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Recovery Campaign">
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Cart Abandonment Recovery"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe trigger strategy..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Min Amount (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Delay (Minutes)</label>
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Save Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
