'use client';

import React, { useState } from 'react';
import { mockStore } from '@/lib/db/mock-store';
import { Report } from '@/lib/types';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Search, MapPin, Calendar, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function TrackReportPage() {
  const [code, setCode] = useState('');
  const [foundReport, setFoundReport] = useState<Report | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const report = mockStore.getReportById(code.trim());
    setFoundReport(report || null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Track Civic Report Status</h1>
        <p className="text-xs text-slate-600">Enter your unique report tracking code (e.g. CP-2026-9812) to inspect real-time progress.</p>
      </div>

      <form onSubmit={handleTrack} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Enter Reference Code</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. CP-2026-9812"
            className="flex-1 p-3 min-h-[44px] text-sm font-mono text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
            required
          />
          <button type="submit" className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center">
            Track Code
          </button>
        </div>
      </form>

      {searched && (
        foundReport ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono text-brand-600 uppercase tracking-wider font-bold">Report Reference</span>
                <h3 className="text-xl font-mono font-bold text-slate-900">{foundReport.reference_code}</h3>
              </div>
              <StatusBadge status={foundReport.status} />
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-bold text-slate-900 text-sm">{foundReport.title}</p>
              <p className="text-slate-600">{foundReport.description}</p>
              <div className="flex items-center space-x-1 text-slate-500 pt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{foundReport.address}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Submission Timestamp</span>
              <span className="font-mono text-slate-900">{new Date(foundReport.submitted_at).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-xs text-rose-800 space-y-2">
            <p className="font-bold">No report found with tracking code &quot;{code}&quot;.</p>
            <p className="text-rose-600">Please verify your tracking code or try searching sample code <span className="font-mono font-bold">CP-2026-9812</span>.</p>
          </div>
        )
      )}
    </div>
  );
}
