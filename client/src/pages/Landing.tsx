import React from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Zap,
  Lock,
  CheckCircle2,
  Cpu,
  Layers,
  BarChart2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Recover<span className="text-sky-400">AI</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/dashboard">
              <Button variant="primary" size="sm" icon={ArrowRight}>
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-950/40 via-slate-950 to-slate-950 -z-10" />
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Razorpay Track 03: AI Revenue Recovery
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Turn failed payments into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              recovered revenue.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            RecoverAI detects revenue at risk, diagnoses root failure causes with AI, enforces deterministic merchant guardrails, and autonomously closes the recovery loop with Razorpay.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" variant="primary" icon={ArrowRight} className="w-full sm:w-auto px-8 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold">
                Launch Live Demo
              </Button>
            </Link>
            <Link to="/simulator">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
                Run 10K Simulation
              </Button>
            </Link>
          </div>

          {/* Autonomous Loop Pill */}
          <div className="mt-12 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 max-w-3xl mx-auto flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="font-semibold text-slate-300">The 8-Step Closed Loop:</span>
            <span className="text-sky-400 font-medium">Detect</span> →
            <span className="text-sky-400 font-medium">Diagnose</span> →
            <span className="text-sky-400 font-medium">Predict</span> →
            <span className="text-sky-400 font-medium">Decide</span> →
            <span className="text-emerald-400 font-medium">Act</span> →
            <span className="text-sky-400 font-medium">Verify</span> →
            <span className="text-emerald-400 font-medium">Recover</span> →
            <span className="text-indigo-400 font-medium">Learn</span>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Why Standard Payment Retries Aren't Enough
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Traditional systems treat failed payments as isolated errors. RecoverAI turns them into an intelligent, multi-channel recovery workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Diagnostics & Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes historical customer success rates, failure classifications (timeout vs hard decline), and transaction value to predict recovery probability with 84%+ confidence.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Deterministic Guardrails</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI never has unrestricted access to money. The Policy Engine enforces maximum attempt caps, cooldown windows, amount-based human escalations, and customer opt-outs.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Razorpay Test Mode Integration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamlessly integrates with Razorpay Payment Links API, webhooks for real-time receipt verification, and automated recovery resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-slate-800 py-12 px-6 bg-slate-950 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-3">Ready to see RecoverAI in action?</h3>
          <p className="text-xs text-slate-400 mb-6">Experience the 1-click ₹4,999 recovery demo scenario or simulate 10,000 transactions.</p>
          <Link to="/dashboard">
            <Button size="md" variant="primary" icon={ArrowRight}>
              Go to Dashboard
            </Button>
          </Link>
          <div className="mt-8 text-[11px] text-slate-400">
            Built for Razorpay Hackathon 2026 • Track 03: AI Revenue Recovery
          </div>
        </div>
      </footer>
    </div>
  );
};
