'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockStore } from '@/lib/db/mock-store';
import { Incident } from '@/lib/types';
import { PriorityBadge, StatusBadge } from '@/components/dashboard/StatusBadge';
import { SLACountdown } from '@/components/dashboard/SLACountdown';
import { Search, Filter, MapPin, Eye, Calendar, ArrowRight } from 'lucide-react';

export default function IssuesExplorerPage() {
  const [incidents] = useState<Incident[]>(mockStore.getIncidents());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = incidents.filter(inc => {
    if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return inc.title.toLowerCase().includes(q) || inc.address.toLowerCase().includes(q) || inc.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Civic Issue Explorer</h1>
          <p className="text-xs text-slate-500">Searchable public database of municipal hazards, report counts, and verification history.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 w-56"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Categories</option>
            <option value="plastic_litter">Plastic Litter</option>
            <option value="blocked_drain">Blocked Drain</option>
            <option value="waterlogging">Waterlogging</option>
            <option value="pothole">Potholes</option>
            <option value="broken_streetlight">Broken Streetlights</option>
            <option value="accessibility_barrier">Accessibility Barriers</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED_PENDING_VERIFICATION">Awaiting Verification</option>
            <option value="VERIFIED_CLOSED">Verified Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>
        </div>
      </div>

      {/* Incidents Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(inc => (
          <div key={inc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                  {inc.category.replace('_', ' ')}
                </span>
                <PriorityBadge level={inc.priority_level} />
              </div>

              <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{inc.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{inc.description}</p>

              <div className="text-xs text-slate-600 flex items-center space-x-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{inc.address}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <StatusBadge status={inc.status} size="sm" />
                <span className="text-slate-500 font-mono text-[11px]">{inc.report_count} Reports</span>
              </div>

              <SLACountdown createdAtIso={inc.first_reported_at} status={inc.status} />

              <Link
                href={`/issues/${inc.id}`}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
              >
                <span>View Full Issue Audit Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
