import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowRight, Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../api/client';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('merchant@demo.in');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('recoverai_token', res.data.data.accessToken);
      localStorage.setItem('recoverai_user', JSON.stringify(res.data.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = async () => {
    try {
      setLoading(true);
      // Auto-register demo merchant if needed
      try {
        const res = await api.post('/auth/register', {
          businessName: 'Apex Store (Razorpay Demo)',
          email: 'merchant@demo.in',
          password: 'Password123!',
          name: 'Vikram Merchant',
        });
        localStorage.setItem('recoverai_token', res.data.data.accessToken);
        localStorage.setItem('recoverai_user', JSON.stringify(res.data.data.user));
        navigate('/dashboard');
        return;
      } catch {
        // Already registered, proceed to login
      }

      const res = await api.post('/auth/login', {
        email: 'merchant@demo.in',
        password: 'Password123!',
      });
      localStorage.setItem('recoverai_token', res.data.data.accessToken);
      localStorage.setItem('recoverai_user', JSON.stringify(res.data.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError('Could not complete quick demo login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20 mb-4">
          <RotateCcw className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to RecoverAI</h2>
        <p className="text-xs text-slate-400 mt-1">Autonomous revenue recovery orchestrator for Razorpay</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-800 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-2 text-slate-400">Hackathon Fast-Track</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            className="w-full border-slate-700 bg-slate-800 text-sky-400 hover:bg-slate-700"
            onClick={handleDemoQuickLogin}
            isLoading={loading}
          >
            1-Click Demo Login
          </Button>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-sky-400 hover:underline">
            Register Merchant
          </Link>
        </div>
      </div>
    </div>
  );
};
