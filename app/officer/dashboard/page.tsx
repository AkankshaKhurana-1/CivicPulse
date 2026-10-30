'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockStore } from '@/lib/db/mock-store';
import { WorkOrder, Incident, PriorityBreakdown } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { SLACountdown } from '@/components/dashboard/SLACountdown';
import { findDuplicateIncidents } from '@/lib/engines/duplicates';
import { CivicMap } from '@/components/map/CivicMap';
import {
  UserCheck, Clock, ShieldAlert, CheckCircle2, Layers, Copy,
  AlertTriangle, Eye, ArrowRight, XCircle, Sparkles, Filter, BarChart3,
  Map as MapIcon
} from 'lucide-react';

export default function OfficerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'priority' | 'duplicates' | 'map'>('queue');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockStore.getWorkOrders());
  const [incidents, setIncidents] = useState<Incident[]>(mockStore.getIncidents());
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [inspectIncident, setInspectIncident] = useState<Incident | null>(null);

  const workers = mockStore.getUsers().filter(u => u.role === 'worker');
  const [workerId, setWorkerId] = useState(workers[0]?.id || 'usr-worker-1');
  const [team, setTeam] = useState('Sanitation & Desilting Quick Response Unit');
  const [mergeNotice, setMergeNotice] = useState<string | null>(null);

  // Collect potential duplicate candidates across active incidents
  const duplicateCandidatesList = incidents
    .filter(i => i.status !== 'VERIFIED_CLOSED')
    .flatMap(inc => {
      const candidates = findDuplicateIncidents(inc.category, inc.lat, inc.lng, incidents, 300);
      return candidates
        .filter(c => c.incident.id !== inc.id && c.duplicate_score >= 60)
        .map(c => ({
          primary: inc,
          duplicate: c.incident,
          candidate: c,
        }));
    })
    // Deduplicate pairs (A-B vs B-A)
    .filter((v, idx, arr) => arr.findIndex(t => t.primary.id === v.duplicate.id && t.duplicate.id === v.primary.id) > idx);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;
    const worker = workers.find(w => w.id === workerId) || workers[0];
    mockStore.assignWorkOrder(selectedWO.id, worker.id, worker.name, team, 'Sanjay Gupta (PWD Nodal Officer)');
    setWorkOrders([...mockStore.getWorkOrders()]);
    setSelectedWO(null);
  };

  const handleMergeDuplicate = (primaryId: string, duplicateId: string) => {
    mockStore.supportExistingIncident(primaryId, 'usr-officer-1', 'Sanjay Gupta (Officer Merge)');
    setIncidents([...mockStore.getIncidents()]);
    setMergeNotice(`Successfully merged and corroborated duplicate incident with primary ticket.`);
    setTimeout(() => setMergeNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded">
          Agency Officer Command Portal
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Municipal Triage & Work Order Queue</h1>
        <p className="text-xs text-slate-500">
          Monitor agency queues, evaluate 7-factor priority scores, resolve duplicate candidates, and assign field worker teams.
        </p>
      </div>

      {mergeNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mergeNotice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'queue'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Work Order Queue ({workOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('priority')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'priority'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Priority Engine Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all relative ${
            activeTab === 'duplicates'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate Review Queue</span>
          {duplicateCandidatesList.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {duplicateCandidatesList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'map'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Jurisdiction Map</span>
        </button>
      </div>

      {/* TAB 1: Work Order Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {workOrders.map(wo => {
            const incident = mockStore.getIncidentById(wo.incident_id);
            return (
              <div key={wo.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{wo.reference_code}</span>
                    <PriorityBadge level={wo.priority_level} />
                    <StatusBadge status={wo.status} size="sm" />
                    {incident?.is_emergency_override && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                        Emergency Override
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{incident?.title}</h3>
                  <p className="text-xs text-slate-600">{incident?.address} | {wo.agency_name}</p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Assigned Worker: <span className="text-slate-900 font-bold">{wo.assigned_worker_name || 'Unassigned (Awaiting Officer)'}</span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end space-y-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <SLACountdown createdAtIso={wo.created_at} status={wo.status} />
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {incident && (
                      <button
                        onClick={() => setInspectIncident(incident)}
                        className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 flex items-center justify-center"
                      >
                        Priority Breakdown
                      </button>
                    )}
                    {wo.status === 'NEW' || wo.status === 'TRIAGE' ? (
                      <button
                        onClick={() => setSelectedWO(wo)}
                        className="flex-1 sm:flex-initial px-5 py-2.5 min-h-[44px] bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center"
                      >
                        Assign Field Worker Team
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                        Dispatched
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Priority Engine Analysis */}
      {activeTab === 'priority' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 text-xs space-y-2">
            <span className="font-bold text-brand-300 uppercase tracking-widest text-[10px] block">Transparent 100-Point Scoring Algorithm</span>
            <p className="text-slate-300">
              Score = Severity (25) + Public Safety (25) + Infrastructure (15) + Recurrence (10) + Age (10) + Corroboration (10) + Evidence (5).
              Emergency hazards (open manholes, live wires) trigger emergency overrides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map(inc => {
              const b = inc.priority_breakdown;
              return (
                <div key={inc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-brand-600 uppercase tracking-wider block">
                        {inc.category.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{inc.title}</h4>
                    </div>
                    <PriorityBadge level={inc.priority_level} />
                  </div>

                  {inc.is_emergency_override && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Emergency Safety Override Active</span>
                      </div>
                      <p className="text-[11px] text-red-700">{inc.emergency_reason}</p>
                    </div>
                  )}

                  {b ? (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                        <span>Total Priority Score</span>
                        <span className="font-mono text-brand-600 text-base">{inc.priority_score} / 100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div>Severity: <span className="font-bold text-slate-900">{b.severity_points}/25</span></div>
                        <div>Public Safety: <span className="font-bold text-slate-900">{b.safety_impact_points}/25</span></div>
                        <div>Infrastructure: <span className="font-bold text-slate-900">{b.infrastructure_points}/15</span></div>
                        <div>Recurrence: <span className="font-bold text-slate-900">{b.recurrence_points}/10</span></div>
                        <div>Incident Age: <span className="font-bold text-slate-900">{b.age_points}/10</span></div>
                        <div>Corroboration: <span className="font-bold text-slate-900">{b.corroboration_points}/10</span></div>
                        <div className="col-span-2">Evidence Confidence: <span className="font-bold text-slate-900">{b.evidence_confidence_points}/5</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">Score: {inc.priority_score}/100</div>
                  )}

                  <p className="text-[11px] text-slate-500 leading-relaxed">{inc.priority_reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Duplicate Review Queue */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          {duplicateCandidatesList.length > 0 ? (
            duplicateCandidatesList.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Copy className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Duplicate Candidate Match • Hybrid Score: {item.candidate.duplicate_score}%
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                    {item.candidate.recommendation.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">PRIMARY INCIDENT</span>
                    <h5 className="font-bold text-slate-900">{item.primary.title}</h5>
                    <p className="text-slate-600">{item.primary.address}</p>
                    <span className="text-[11px] font-mono text-brand-600 font-bold block mt-1">
                      {item.primary.report_count} Reports • Priority: {item.primary.priority_score}/100
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-600 block">SUSPECTED DUPLICATE</span>
                    <h5 className="font-bold text-slate-900">{item.duplicate.title}</h5>
                    <p className="text-slate-600">{item.duplicate.address}</p>
                    <span className="text-[11px] font-mono text-amber-700 font-bold block mt-1">
                      Distance: {item.candidate.distance_meters}m • Geo Sim: {item.candidate.geo_similarity}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Signals: {item.candidate.signals_used.join(' • ')}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMergeDuplicate(item.primary.id, item.duplicate.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Confirm Merge (+Corroborate)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No active duplicate candidates in review queue.</p>
              <p className="text-slate-400 mt-1">All incoming reports have been verified as geographically or semantically distinct.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: Jurisdiction Map */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Geospatial distribution of reported incidents, priority levels, and triage status across your municipal jurisdiction.</span>
            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 self-start sm:self-auto">
              {incidents.length} Jurisdiction Incidents
            </span>
          </div>
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full">
            <CivicMap incidents={incidents} showSearch={true} showFilters={true} showLegend={true} />
          </div>
        </div>
      )}

      {/* Priority Breakdown Modal */}
      {inspectIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-brand-600 font-bold uppercase tracking-wider block">
                  {inspectIncident.category.replace('_', ' ')}
                </span>
                <h3 className="font-bold text-base text-slate-900">{inspectIncident.title}</h3>
              </div>
              <button onClick={() => setInspectIncident(null)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            {inspectIncident.priority_breakdown && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl">
                  <span className="font-bold">Total Priority Score</span>
                  <span className="font-mono text-xl font-black text-brand-300">
                    {inspectIncident.priority_breakdown.total_score} / 100
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700">
                  <div className="flex justify-between"><span>1. Issue Severity:</span> <span className="font-bold">{inspectIncident.priority_breakdown.severity_points} / 25</span></div>
                  <div className="flex justify-between"><span>2. Public Safety & Impact:</span> <span className="font-bold">{inspectIncident.priority_breakdown.safety_impact_points} / 25</span></div>
                  <div className="flex justify-between"><span>3. Infrastructure Importance:</span> <span className="font-bold">{inspectIncident.priority_breakdown.infrastructure_points} / 15</span></div>
                  <div className="flex justify-between"><span>4. Recurrence:</span> <span className="font-bold">{inspectIncident.priority_breakdown.recurrence_points} / 10</span></div>
                  <div className="flex justify-between"><span>5. Incident Age:</span> <span className="font-bold">{inspectIncident.priority_breakdown.age_points} / 10</span></div>
                  <div className="flex justify-between"><span>6. Citizen Corroboration:</span> <span className="font-bold">{inspectIncident.priority_breakdown.corroboration_points} / 10</span></div>
                  <div className="flex justify-between"><span>7. Evidence Confidence:</span> <span className="font-bold">{inspectIncident.priority_breakdown.evidence_confidence_points} / 5</span></div>
                </div>
              </div>
            )}

            <button
              onClick={() => setInspectIncident(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {selectedWO && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleAssign} className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900">Assign Work Order to Field Team</h3>
            <p className="text-xs text-slate-500">Work Order Code: <span className="font-mono font-bold text-slate-900">{selectedWO.reference_code}</span></p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Select Field Worker Lead</label>
              <select
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
              >
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Operational Team Designation</label>
              <input
                type="text"
                value={team}
                onChange={e => setTeam(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
                required
              />
            </div>

            <div className="flex flex-col-reverse xs:flex-row xs:justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedWO(null)}
                className="w-full xs:w-auto px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full xs:w-auto px-5 py-2.5 min-h-[44px] bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5"
              >
                <span>Confirm Assignment</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
