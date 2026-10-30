'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mockStore } from '@/lib/db/mock-store';
import {
  InfrastructureAsset,
  Incident,
  WorkOrder,
  Evidence,
  RecurrenceEvent,
  RootCauseRecommendation,
  MaintenanceInspection,
} from '@/lib/types';
import { CivicMap } from '@/components/map/CivicMap';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  History,
  Layers,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';

export default function InfrastructureAssetProfilePage() {
  const params = useParams();
  const assetId = (params?.id as string) || 'INF-CHD-001';

  const [asset, setAsset] = useState<InfrastructureAsset | undefined>(() => {
    return mockStore.getInfrastructureAssetById(assetId) || mockStore.getInfrastructureAssets()[0];
  });

  const [recommendations, setRecommendations] = useState<RootCauseRecommendation[]>(() => {
    return mockStore.getRootCauseRecommendations(asset?.id);
  });

  const [inspections, setInspections] = useState<MaintenanceInspection[]>(() => {
    return mockStore.getMaintenanceInspections(asset?.id);
  });

  const [isConverting, setIsConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  // Linked Incidents
  const incidents = useMemo(() => {
    if (!asset) return [];
    return mockStore
      .getIncidents()
      .filter(inc => asset.linked_incident_ids.includes(inc.id) || inc.infrastructure_asset_id === asset.id);
  }, [asset]);

  // Linked Work Orders
  const workOrders = useMemo(() => {
    if (!asset) return [];
    const incidentIds = incidents.map(i => i.id);
    return mockStore
      .getWorkOrders()
      .filter(wo => incidentIds.includes(wo.incident_id) || wo.infrastructure_asset_id === asset.id);
  }, [asset, incidents]);

  // Linked Evidence
  const evidenceList = useMemo(() => {
    const woIds = workOrders.map(w => w.id);
    return mockStore.getEvidence().filter(ev => ev.work_order_id && woIds.includes(ev.work_order_id));
  }, [workOrders]);

  // Recurrence Events
  const recurrenceEvents = useMemo(() => {
    if (!asset) return [];
    return mockStore.getRecurrenceEvents(asset.id);
  }, [asset]);

  // Handle convert recommendation to inspection
  const handleConvertRecommendation = (recId: string) => {
    setIsConverting(true);
    const scheduledDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const createdInspection = mockStore.convertRecommendationToInspection(
      recId,
      scheduledDate,
      'Authorized priority geotechnical core drilling and drainage audit by State Oversight.'
    );

    if (createdInspection) {
      setRecommendations([...mockStore.getRootCauseRecommendations(asset?.id)]);
      setInspections([...mockStore.getMaintenanceInspections(asset?.id)]);
      setConvertSuccess(`Successfully authorized official Engineering Inspection #${createdInspection.id}!`);
      setTimeout(() => setConvertSuccess(null), 5000);
    }
    setIsConverting(false);
  };

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Infrastructure Asset Not Found</h2>
        <p className="text-sm text-slate-500">The requested physical municipal asset record could not be located.</p>
        <Link
          href="/admin"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Governance Portal</span>
        </Link>
      </div>
    );
  }

  const monitoringBadge = () => {
    switch (asset.monitoring_status) {
      case 'CHRONIC_FAILURE_ZONE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300 flex items-center space-x-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Chronic Failure Zone (Root-Cause Review)</span>
          </span>
        );
      case 'REPAIRED_UNDER_MONITORING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Under 60-Day Recurrence Monitoring</span>
          </span>
        );
      case 'RECURRENCE_DETECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>Post-Repair Recurrence Detected</span>
          </span>
        );
      case 'FIRST_TIME_FAILURE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>Initial Failure Reported</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Healthy Verified</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back navigation & Category Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/oversight/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Oversight</span>
        </Link>
        <span className="text-xs font-mono font-bold text-slate-500">Asset Record ID: {asset.id}</span>
      </div>

      {/* Main Asset Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-900 text-white text-xs font-black font-mono rounded-lg">
                {asset.asset_code}
              </span>
              <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase rounded-lg">
                {asset.infrastructure_type}
              </span>
              {asset.is_chronic_failure && (
                <span className="px-3 py-1 bg-rose-600 text-white text-xs font-black uppercase rounded-lg shadow-sm flex items-center space-x-1 animate-pulse">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Chronic Infrastructure Failure</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {asset.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{asset.address} ({asset.lat.toFixed(5)}, {asset.lng.toFixed(5)})</span>
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end space-y-2 shrink-0">
            {monitoringBadge()}
            <span className="text-[11px] text-slate-400">
              Last Repaired: {asset.last_repaired_at ? new Date(asset.last_repaired_at).toLocaleDateString() : 'Pending'}
            </span>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Failure Cycles</span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-mono mt-1">
              {asset.failure_count}
            </div>
            <div className="text-[10px] text-slate-400">Distinct Incidents</div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Repairs Completed</span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 font-mono mt-1">
              {asset.repair_count}
            </div>
            <div className="text-[10px] text-slate-400">Contractor Interventions</div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Repeat Recurrences</span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 font-mono mt-1">
              {asset.recurrence_count}
            </div>
            <div className="text-[10px] text-slate-400">Post-Repair Failures</div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Recurrence</span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 font-mono mt-1">
              {asset.average_recurrence_days || 25}d
            </div>
            <div className="text-[10px] text-slate-400">Mean Days to Breakdown</div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chronic Risk</span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-600 font-mono mt-1">
              {asset.is_chronic_failure ? 'HIGH' : 'LOW'}
            </div>
            <div className="text-[10px] text-slate-400">Repeated Breakdown Rule</div>
          </div>
        </div>
      </div>

      {/* Success Notification if converted */}
      {convertSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{convertSuccess}</span>
        </div>
      )}

      {/* Interactive Map Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Geospatial Failure Footprint</h2>
          </div>
          <span className="text-xs font-mono text-slate-500 self-start sm:self-auto">
            Center: [{asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}]
          </span>
        </div>
        <div className="h-[320px] sm:h-[380px] w-full rounded-2xl overflow-hidden border border-slate-200">
          <CivicMap
            incidents={incidents}
            infrastructureAssets={[asset]}
            selectedAssetId={asset.id}
            center={[asset.lat, asset.lng]}
            zoom={16}
            showSearch={false}
            showFilters={false}
            showLegend={true}
          />
        </div>
      </div>

      {/* Engineering Root Cause Recommendations Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Root Cause Recommendation Engine</h2>
              <p className="text-xs text-slate-300">
                Rule-based engineering intelligence triggered by repetitive post-repair breakdown pattern.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
            {recommendations.length} Active Recommendation(s)
          </span>
        </div>

        <div className="space-y-4">
          {recommendations.map(rec => {
            const isConverted = rec.status === 'CONVERTED_TO_INSPECTION_WORK_ORDER';
            return (
              <div
                key={rec.id}
                className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {rec.severity} SEVERITY
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {rec.id}</span>
                  </div>
                  <span className="text-xs font-bold text-teal-300 font-mono">
                    Status: {rec.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Identified Root Cause Pattern
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {rec.root_cause_explanation}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Recommended Engineering Action
                    </div>
                    <p className="text-xs text-teal-300 leading-relaxed font-semibold">
                      {rec.recommended_action}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    Target Agency: <strong className="text-white">{rec.recommended_agency}</strong> | Generated:{' '}
                    {new Date(rec.created_at).toLocaleDateString()}
                  </div>

                  {isConverted ? (
                    <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Inspection Work Order #{rec.converted_work_order_id} Active</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConvertRecommendation(rec.id)}
                      disabled={isConverting}
                      className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center space-x-2"
                    >
                      <Wrench className="w-3.5 h-3.5 text-white" />
                      <span>Convert to Official Engineering Inspection</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Evidence Gallery Across Cycles */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">Multi-Cycle Evidence Archive</h2>
          </div>
          <span className="text-xs text-slate-500">{evidenceList.length} total verification photos captured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workOrders.map((wo, index) => {
            const cycleEvidence = evidenceList.filter(e => e.work_order_id === wo.id);
            const beforeEv = cycleEvidence.find(e => e.evidence_type === 'INITIAL_REPORT' || e.evidence_type === 'BEFORE_WORK');
            const afterEv = cycleEvidence.find(e => e.evidence_type === 'AFTER_WORK');
            const analysis = mockStore.getRepairVerificationAnalysis(wo.id);

            return (
              <div
                key={wo.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded">
                      Repair Cycle #{index + 1}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{wo.reference_code}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-rose-700 uppercase">Before Repair</div>
                      {beforeEv?.url ? (
                        <img
                          src={beforeEv.url}
                          alt="Before photo"
                          className="w-full h-28 object-cover rounded-lg border border-slate-300"
                        />
                      ) : (
                        <div className="w-full h-28 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                          No Photo
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">After Repair</div>
                      {afterEv?.url ? (
                        <img
                          src={afterEv.url}
                          alt="After photo"
                          className="w-full h-28 object-cover rounded-lg border border-slate-300"
                        />
                      ) : (
                        <div className="w-full h-28 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>AI Clearance:</span>
                    <strong className="text-teal-700 font-mono">
                      {analysis ? `${analysis.visual_difference_score}%` : '85%'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GPS Verification:</span>
                    <strong className="text-slate-800 font-mono">
                      {analysis?.distance_meters !== undefined ? `${analysis.distance_meters}m` : '8.2m (Match)'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status:</span>
                    <strong className="text-slate-900 font-mono">{wo.status}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological Failure & Repair Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900">Failure DNA Chronological Timeline</h2>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
          {/* Cycle 1 */}
          <div className="relative space-y-2">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white ring-4 ring-rose-100"></div>
            <div className="text-xs font-bold text-slate-500 font-mono">2026-06-15 • Initial Hazard</div>
            <h3 className="text-sm font-bold text-slate-900">Incident Reported: Severe Pothole Cluster near Gate 2</h3>
            <p className="text-xs text-slate-600">
              Multiple citizen reports filed. Assigned to PWD Highway Maintenance Division.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
              <span>Work Order <strong className="font-mono">WO-CU-2026-001</strong> completed & verified closed.</span>
              <span className="text-emerald-700 font-bold">Closed 2026-06-18</span>
            </div>
          </div>

          {/* Recurrence 1 */}
          <div className="relative space-y-2">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-100"></div>
            <div className="text-xs font-bold text-slate-500 font-mono">2026-07-11 • Recurrence #1 (23 Days Post-Repair)</div>
            <h3 className="text-sm font-bold text-slate-900">Asphalt Surface Delamination & Re-opened Pothole</h3>
            <p className="text-xs text-slate-600">
              Surface patch detached during monsoon rain showers. Work Order <strong className="font-mono">WO-CU-2026-002</strong> re-excavated and repaved with cold-mix bitumen.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
              <span>Verified Closed on 2026-07-14. Repair Accountability Engine logged first recurrence cycle.</span>
              <span className="font-bold">23 Days Interval</span>
            </div>
          </div>

          {/* Recurrence 2 */}
          <div className="relative space-y-2">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-white ring-4 ring-purple-100"></div>
            <div className="text-xs font-bold text-slate-500 font-mono">2026-08-10 • Recurrence #2 (27 Days Post-Repair)</div>
            <h3 className="text-sm font-bold text-slate-900">
              Repetitive Surface Failure: Heavy Vehicle Wheel Rutting & Hole Expansion
            </h3>
            <p className="text-xs text-slate-600">
              3rd incident at identical coordinates. Engine triggered <strong className="text-rose-600">CHRONIC_FAILURE_ZONE</strong> rule (&ge;3 incidents, &ge;2 repairs).
            </p>
            <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center justify-between">
              <span>Work Order <strong className="font-mono">WO-CU-2026-003</strong> awaiting supervisor verification.</span>
              <span className="font-bold">Recommendation Generated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
