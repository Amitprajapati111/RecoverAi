import React, { useState } from 'react';
import { Sparkles, Play, Bell, Shield, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface NavbarProps {
  onOpenAskAI: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAskAI }) => {
  const navigate = useNavigate();
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const user = JSON.parse(localStorage.getItem('recoverai_user') || '{"name": "Razorpay Merchant", "email": "merchant@demo.in"}');

  const handleRunWinningDemo = async () => {
    try {
      setIsRunningDemo(true);
      await api.post('/simulator/winning-demo');
      navigate('/dashboard');
      window.location.reload();
    } catch (error) {
      console.error('Demo error:', error);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('recoverai_token');
    localStorage.removeItem('recoverai_user');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          TEST MODE (RZP)
        </span>
        <span className="text-xs text-slate-400">|</span>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Loop: Detect → Diagnose → Predict → Decide → Act → Verify → Recover
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {/* Ask RecoverAI trigger button */}
        <Button
          variant="secondary"
          size="sm"
          icon={Sparkles}
          onClick={onOpenAskAI}
          className="border-sky-200 text-sky-700 bg-sky-50/50 hover:bg-sky-100/60"
        >
          Ask RecoverAI
        </Button>

        {/* 1-Click Winning Demo button */}
        <Button
          variant="primary"
          size="sm"
          icon={Play}
          onClick={handleRunWinningDemo}
          isLoading={isRunningDemo}
          className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-sm"
        >
          Run Winning Demo
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User avatar & logout */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
            {user.name?.charAt(0) || 'M'}
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
