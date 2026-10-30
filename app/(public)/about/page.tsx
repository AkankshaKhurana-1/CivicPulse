import React from 'react';
import { Shield, CheckCircle2, Lock, Layers, BarChart2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-1.5 bg-brand-50 border border-brand-200 text-brand-700 px-3 py-1 rounded-full text-xs font-semibold">
          <Shield className="w-4 h-4 text-brand-600" />
          <span>Platform Architecture & Transparency Guidelines</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">About CivicPulse</h1>
        <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
          CivicPulse is designed as a reusable, secure, multi-city civic infrastructure platform ensuring transparent accountability from report to evidence-verified resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <Lock className="w-4 h-4 text-brand-600 mr-2" /> Data Privacy & Security Rules
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Citizen contact details and private original uploads are strictly restricted. Public maps display privacy-safe approximate location markers. Row Level Security (RLS) is enforced at the database level.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Evidence-Based Closure
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Work orders are never closed automatically upon worker completion. An independent supervisor must review side-by-side before/after photos and approve resolution.
          </p>
        </div>
      </div>
    </div>
  );
}
