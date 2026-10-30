'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { WorkOrder, Evidence, VerificationOutcome } from '@/lib/types';
import { mockStore } from '@/lib/db/mock-store';
import { analyzeRepairEvidence } from '@/lib/engines/repair-accountability';
import { getOpenStreetMapDirectionsUrl } from '@/components/map/MapConfig';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  HelpCircle,
  FileText,
  Activity,
  Layers,
  ExternalLink,
} from 'lucide-react';

interface EvidenceReviewModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export function EvidenceReviewModal({ workOrder, onClose, onSuccess }: EvidenceReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [evidenceRequestNotes, setEvidenceRequestNotes] = useState('');
  const [activeActionForm, setActiveActionForm] = useState<'NONE' | 'REJECT' | 'REQUEST_MORE'>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incident = useMemo(() => {
    return mockStore.getIncidentById(workOrder.incident_id);
  }, [workOrder.incident_id]);

  const evidenceList = useMemo(() => {
    return mockStore.getEvidence(workOrder.id);
  }, [workOrder.id]);

  const initialEvidence = useMemo(() => {
    return (
      evidenceList.find(e => e.evidence_type === 'INITIAL_REPORT' || e.evidence_type === 'BEFORE_WORK') ||
      evidenceList[0]
    );
  }, [evidenceList]);

  const afterEvidence = useMemo(() => {
    return (
      evidenceList.find(e => e.evidence_type === 'AFTER_WORK') ||
      evidenceList[evidenceList.length - 1]
    );
  }, [evidenceList]);

  // Asset Lookup (Failure DNA)
  const asset = useMemo(() => {
    const assets = mockStore.getInfrastructureAssets();
    if (workOrder.infrastructure_asset_id) {
      return assets.find(a => a.id === workOrder.infrastructure_asset_id);
    }
    if (incident) {
      return (
        assets.find(a => a.linked_incident_ids.includes(incident.id)) ||
        assets.find(a => a.category === incident.category && a.id === 'INF-CHD-001')
      );
    }
    return undefined;
  }, [workOrder, incident]);

  // AI Verification Analysis
  const analysis = useMemo(() => {
    let existing = mockStore.getRepairVerificationAnalysis(workOrder.id);
    if (!existing && incident) {
      existing = analyzeRepairEvidence(
        workOrder.id,
        incident,
        initialEvidence,
        afterEvidence,
        evidenceList
      );
      mockStore.saveRepairVerificationAnalysis(existing);
    }
    return existing;
  }, [workOrder.id, incident, initialEvidence, afterEvidence, evidenceList]);

  const supervisorName = 'Dr. Meera Iyer (Oversight Director)';

  const handleApprove = () => {
    setIsSubmitting(true);
    mockStore.reviewWorkOrderVerification(
      workOrder.id,
      'APPROVED',
      'Verification approved after inspecting field evidence photos and AI scene clearance.',
      supervisorName
    );
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setIsSubmitting(true);
    mockStore.reviewWorkOrderVerification(
      workOrder.id,
      'REJECTED',
      rejectionReason,
      supervisorName
    );
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  const handleRequestMoreEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceRequestNotes.trim()) return;
    setIsSubmitting(true);
    mockStore.reviewWorkOrderVerification(
      workOrder.id,
      'NEEDS_MORE_EVIDENCE',
      evidenceRequestNotes,
      supervisorName
    );
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  const getOutcomeBadge = (outcome?: VerificationOutcome) => {
    switch (outcome) {
      case 'ACCEPTABLE_EVIDENCE':
        return {
          label: 'ACCEPTABLE EVIDENCE',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        };
      case 'INSUFFICIENT_EVIDENCE':
        return {
          label: 'INSUFFICIENT EVIDENCE',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        };
      case 'LOCATION_MISMATCH':
        return {
          label: 'LOCATION MISMATCH',
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <MapPin className="w-4 h-4 text-rose-600" />,
        };
      case 'POSSIBLE_DUPLICATE_EVIDENCE':
        return {
          label: 'SUSPECTED DUPLICATE EVIDENCE',
          badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: <Layers className="w-4 h-4 text-purple-600" />,
        };
      default:
        return {
          label: 'MANUAL REVIEW REQUIRED',
          badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <HelpCircle className="w-4 h-4 text-blue-600" />,
        };
    }
  };

  const outcomeStyle = getOutcomeBadge(analysis?.verification_outcome);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Repair Accountability Verification</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Dual-Audit
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Work Order: <span className="font-mono text-teal-300">{workOrder.reference_code}</span> | {workOrder.agency_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Infrastructure Failure DNA Banner (if asset exists) */}
          {asset && (
            <div
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                asset.is_chronic_failure
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-sky-50 border-sky-200 text-sky-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Activity className={`w-4 h-4 ${asset.is_chronic_failure ? 'text-rose-600' : 'text-sky-600'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Infrastructure Asset DNA: {asset.asset_code}
                  </span>
                  {asset.is_chronic_failure && (
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-rose-600 text-white animate-pulse">
                      Chronic Failure Zone
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold">{asset.name}</div>
                <p className="text-xs text-slate-600">
                  Historical Records: <span className="font-bold">{asset.failure_count} failure cycles</span>,{' '}
                  <span className="font-bold">{asset.repair_count} repairs</span>,{' '}
                  <span className="font-bold text-rose-700">{asset.recurrence_count} post-repair recurrences</span>
                  {asset.average_recurrence_days ? ` (Avg interval: ${asset.average_recurrence_days} days)` : ''}.
                </p>
              </div>

              <Link
                href={`/infrastructure/${asset.id}`}
                target="_blank"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-bold text-slate-800 shadow-sm shrink-0 transition"
              >
                <span>View Asset DNA Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Work Order & Incident Summary */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Work Resolution Report
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Assigned: {workOrder.assigned_worker_name || 'Field Crew'}
              </span>
            </div>
            <p className="text-sm text-slate-800 font-medium">
              {workOrder.resolution_notes || 'Worker submitted task as completed and attached completion evidence.'}
            </p>
          </div>

          {/* Side by Side Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before Photo */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
                  Before Work / Initial Hazard
                </span>
                <span className="text-[11px] text-slate-500">
                  {initialEvidence?.captured_at ? new Date(initialEvidence.captured_at).toLocaleDateString() : 'Initial submission'}
                </span>
              </div>
              {initialEvidence?.url ? (
                <div className="w-full relative group">
                  <img
                    src={initialEvidence.url}
                    alt="Before work evidence"
                    className="w-full h-48 sm:h-64 object-cover rounded-xl border border-slate-300 shadow-inner"
                  />
                  {initialEvidence.lat && initialEvidence.lng && (
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-mono flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{initialEvidence.lat.toFixed(5)}, {initialEvidence.lng.toFixed(5)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 sm:h-64 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8 mr-2" /> No initial image available
                </div>
              )}
            </div>

            {/* After Photo */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                  After Work / Repair Evidence
                </span>
                <span className="text-[11px] text-slate-500">
                  {afterEvidence?.captured_at ? new Date(afterEvidence.captured_at).toLocaleDateString() : 'Completion photo'}
                </span>
              </div>
              {afterEvidence?.url ? (
                <div className="w-full relative group">
                  <img
                    src={afterEvidence.url}
                    alt="After work evidence"
                    className="w-full h-48 sm:h-64 object-cover rounded-xl border border-slate-300 shadow-inner"
                  />
                  {afterEvidence.lat && afterEvidence.lng && (
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-mono flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{afterEvidence.lat.toFixed(5)}, {afterEvidence.lng.toFixed(5)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 sm:h-64 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8 mr-2" /> No completion image
                </div>
              )}
            </div>
          </div>

          {/* AI-Powered Repair Verification Analysis Panel */}
          {analysis && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 border border-slate-700 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  <span className="font-bold text-sm tracking-wide text-white">
                    AI Repair Accountability Engine Analysis
                  </span>
                </div>
                <div
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${outcomeStyle.badgeClass}`}
                >
                  {outcomeStyle.icon}
                  <span>{outcomeStyle.label}</span>
                </div>
              </div>

              {/* 4 Score Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Image Quality</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    {analysis.photo_quality_score ?? analysis.image_quality_score ?? 85}/100
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {(analysis.photo_quality_score ?? analysis.image_quality_score ?? 85) >= 70 ? 'High Sharpness' : 'Adequate'}
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Site Clearance</div>
                  <div className="text-xl font-bold font-mono text-teal-300 mt-0.5">
                    {analysis.visual_difference_score ?? analysis.visual_comparison_score ?? 88}/100
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Visual Scene Change</div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">GPS Distance</div>
                  <div
                    className={`text-xl font-bold font-mono mt-0.5 ${
                      analysis.location_matched ? 'text-sky-400' : 'text-rose-400'
                    }`}
                  >
                    {analysis.distance_meters !== undefined ? `${analysis.distance_meters}m` : 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {analysis.location_matched
                      ? `Within ±${analysis.worker_accuracy_buffer || 25}m buffer`
                      : 'Exceeds threshold'}
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Perceptual Hash</div>
                  <div
                    className={`text-base font-bold font-mono mt-1 ${
                      analysis.duplicate_check?.is_duplicate ? 'text-purple-400' : 'text-emerald-400'
                    }`}
                  >
                    {analysis.duplicate_check?.is_duplicate ? 'Duplicate' : 'Unique'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {analysis.duplicate_check?.is_duplicate
                      ? 'Reused Photo Flag'
                      : 'Fresh Photo Signature'}
                  </div>
                </div>
              </div>

              {/* Before-and-After GPS Evidence Comparison */}
              {initialEvidence?.lat != null && initialEvidence?.lng != null && afterEvidence?.lat != null && afterEvidence?.lng != null && (
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
                    <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block sm:inline">
                      Field GPS Verification:
                    </span>
                    <span className="inline-flex items-center space-x-1 text-rose-300 font-mono text-[11px]">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{initialEvidence.lat.toFixed(5)}, {initialEvidence.lng.toFixed(5)}</span>
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="inline-flex items-center space-x-1 text-emerald-300 font-mono text-[11px]">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{afterEvidence.lat.toFixed(5)}, {afterEvidence.lng.toFixed(5)}</span>
                    </span>
                    <span className="font-mono text-teal-300 font-bold ml-1">
                      ({analysis.distance_meters !== undefined ? `${analysis.distance_meters}m` : '0m'} offset)
                    </span>
                  </div>

                  <a
                    href={getOpenStreetMapDirectionsUrl(afterEvidence.lat, afterEvidence.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1 shrink-0 self-start sm:self-auto"
                    title="View coordinates on OpenStreetMap"
                  >
                    <span>View on OpenStreetMap</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* AI Explanation Text */}
              <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-teal-300 mr-1.5">AI Finding:</span>
                {analysis.explanation}
              </div>

              {/* Statutory Notice */}
              <div className="text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Statutory Notice:</strong> {analysis.statutory_limitations_notice}
                </span>
              </div>
            </div>
          )}

          {/* Action Form: Rejection */}
          {activeActionForm === 'REJECT' && (
            <form onSubmit={handleReject} className="bg-rose-50 border border-rose-300 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider">
                Specify Reason for Evidence Rejection (Returns to Field Worker for Rework)
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Patch is incomplete or debris remains on the carriageway. Must re-level and compact."
                className="w-full p-2.5 text-xs text-slate-900 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                rows={3}
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveActionForm('NONE')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shadow"
                >
                  Confirm Rejection & Reopen
                </button>
              </div>
            </form>
          )}

          {/* Action Form: Request More Evidence */}
          {activeActionForm === 'REQUEST_MORE' && (
            <form onSubmit={handleRequestMoreEvidence} className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                Request Additional Evidence from Field Worker
              </label>
              <textarea
                value={evidenceRequestNotes}
                onChange={e => setEvidenceRequestNotes(e.target.value)}
                placeholder="e.g. Please capture a wider-angle photo showing the repaired asphalt alongside the landmark or street milestone."
                className="w-full p-2.5 text-xs text-slate-900 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                rows={3}
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveActionForm('NONE')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow"
                >
                  Send Evidence Request
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        {activeActionForm === 'NONE' && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-600 hover:text-slate-900 transition rounded-xl border border-slate-200 sm:border-transparent flex items-center justify-center"
            >
              Close Preview
            </button>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
              <button
                onClick={() => setActiveActionForm('REQUEST_MORE')}
                className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Request Additional Evidence</span>
              </button>

              <button
                onClick={() => setActiveActionForm('REJECT')}
                className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject Completion Evidence</span>
              </button>

              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-5 py-2.5 min-h-[44px] text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Approve & Verify Closed (60-Day Monitoring)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
