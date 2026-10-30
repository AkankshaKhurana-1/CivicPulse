'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockStore } from '@/lib/db/mock-store';
import { WorkOrder, Incident } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { SLACountdown } from '@/components/dashboard/SLACountdown';
import { EvidenceReviewModal } from '@/components/verification/EvidenceReviewModal';
import { CivicMap } from '@/components/map/CivicMap';
import {
  ShieldCheck,
  Eye,
  AlertTriangle,
  CheckCircle2,
  History,
  List,
  Map as MapIcon,
  Sparkles,
  MapPin,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function OversightDashboardPage() {
  const [viewMode, setViewMode] = useState<'queue' | 'map'>('queue');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockStore.getWorkOrders());
  const [reviewWO, setReviewWO] = useState<WorkOrder | null>(null);

  const pendingVerification = workOrders.filter(w => w.status === 'COMPLETED_PENDING_VERIFICATION');
  const breachedSLA = workOrders.filter(w => w.sla_breached && w.status !== 'VERIFIED_CLOSED');
  const allIncidents = mockStore.getIncidents();
  const allAssets = mockStore.getInfrastructureAssets();

  const getAIOutcomeBadge = (woId: string) => {
    const analysis = mockStore.getRepairVerificationAnalysis(woId);
    if (!analysis) return null;

    switch (analysis.verification_outcome) {
      case 'ACCEPTABLE_EVIDENCE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI: Acceptable ({analysis.visual_difference_score}%)</span>
          </span>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>AI: Insufficient Evidence</span>
          </span>
        );
      case 'LOCATION_MISMATCH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>AI: Location Mismatch ({analysis.distance_meters}m)</span>
          </span>
        );
      case 'POSSIBLE_DUPLICATE_EVIDENCE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>AI: Duplicate Photo Flag</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI: Manual Review</span>
          </span>
        );
    }
  };

  const getAssetForWorkOrder = (wo: WorkOrder) => {
    if (wo.infrastructure_asset_id) {
      return allAssets.find(a => a.id === wo.infrastructure_asset_id);
    }
    return allAssets.find(a => a.linked_incident_ids.includes(wo.incident_id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
              State Oversight & Accountability
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded">
              AI-Assisted Verification
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Evidence Verification & Failure DNA Oversight
          </h1>
          <p className="text-xs text-slate-500">
            Conduct independent before-and-after photo evidence audits, evaluate AI scene clearance scores, inspect recurring failure zones, and trigger 60-day repair monitoring.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setViewMode('queue')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewMode === 'queue' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Verification Queue</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewMode === 'map' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Inspection Sites Map</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Awaiting Review</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{pendingVerification.length} Tasks</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">SLA Breaches</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">{breachedSLA.length} Tasks</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Verified Closures</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {workOrders.filter(w => w.status === 'VERIFIED_CLOSED').length} Tasks
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Chronic Assets</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">
            {allAssets.filter(a => a.is_chronic_failure).length} Assets
          </div>
        </div>
      </div>

      {/* View Mode: Inspection Sites Map */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Geospatial distribution of completed tasks awaiting oversight audit and active SLA breach zones.</span>
            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200 self-start sm:self-auto">
              {allIncidents.length} Audit Sites Plotted
            </span>
          </div>
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full">
            <CivicMap
              incidents={allIncidents}
              infrastructureAssets={allAssets}
              showSearch={true}
              showFilters={true}
              showLegend={true}
            />
          </div>
        </div>
      )}

      {/* View Mode: Work Orders Queue */}
      {viewMode === 'queue' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Work Orders Awaiting Evidence Verification</h2>
          {workOrders.map(wo => {
            const incident = mockStore.getIncidentById(wo.incident_id);
            const asset = getAssetForWorkOrder(wo);
            const aiBadge = getAIOutcomeBadge(wo.id);

            return (
              <div
                key={wo.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-300"
              >
                <div className="space-y-2.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{wo.reference_code}</span>
                    <PriorityBadge level={wo.priority_level} />
                    <StatusBadge status={wo.status} />
                    {aiBadge}
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{incident?.title}</h3>
                  <p className="text-xs text-slate-600">{incident?.address} | {wo.agency_name}</p>

                  {/* Asset DNA Info Tag */}
                  {asset && (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-500 font-mono font-semibold">Asset: {asset.asset_code}</span>
                      {asset.is_chronic_failure ? (
                        <Link
                          href={`/infrastructure/${asset.id}`}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 hover:bg-rose-200 border border-rose-300 transition"
                        >
                          <Activity className="w-3 h-3 text-rose-600" />
                          <span>⚠️ Chronic Failure Zone ({asset.failure_count} cycles)</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/infrastructure/${asset.id}`}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                          <span>Failure DNA Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}

                  {wo.resolution_notes && (
                    <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                      Notes: {wo.resolution_notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between sm:justify-end gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <SLACountdown createdAtIso={wo.created_at} status={wo.status} />
                  <button
                    onClick={() => setReviewWO(wo)}
                    className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5 transition"
                  >
                    <Eye className="w-4 h-4 text-white" />
                    <span>Inspect Side-by-Side Photos</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Review Modal */}
      {reviewWO && (
        <EvidenceReviewModal
          workOrder={reviewWO}
          onClose={() => setReviewWO(null)}
          onSuccess={() => setWorkOrders([...mockStore.getWorkOrders()])}
        />
      )}
    </div>
  );
}
