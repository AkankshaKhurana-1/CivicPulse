'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockStore } from '@/lib/db/mock-store';
import { PriorityBadge, StatusBadge } from '@/components/dashboard/StatusBadge';
import { SLACountdown } from '@/components/dashboard/SLACountdown';
import { CivicMap } from '@/components/map/CivicMap';
import { getOpenStreetMapDirectionsUrl } from '@/components/map/MapConfig';
import {
  MapPin, Calendar, Clock, ShieldCheck, History, ArrowLeft, Image as ImageIcon,
  Compass, ExternalLink
} from 'lucide-react';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const incident = mockStore.getIncidentById(id);
  const workOrder = mockStore.getWorkOrders().find(w => w.incident_id === id);
  const auditEvents = mockStore.getAuditEvents(id).concat(workOrder ? mockStore.getAuditEvents(workOrder.id) : []);
  const evidenceList = workOrder ? mockStore.getEvidence(workOrder.id) : [];
  const allIncidents = mockStore.getIncidents();

  if (!incident) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Incident Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested civic report reference does not exist or has been archived.</p>
        <button onClick={() => router.push('/issues')} className="px-4 py-2 bg-brand-600 text-white font-semibold text-xs rounded-lg">
          Return to Issue Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explorer</span>
      </button>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded">
                {incident.category.replace('_', ' ')}
              </span>
              <PriorityBadge level={incident.priority_level} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">{incident.title}</h1>
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{incident.address}</span>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2 shrink-0">
            <StatusBadge status={incident.status} />
            <span className="text-[11px] text-slate-400 font-mono">Incident ID: {incident.id}</span>
          </div>
        </div>

        {/* Priority & SLA Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Priority Score</span>
            <span className="text-lg font-black text-slate-900">{incident.priority_score} / 100</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{incident.priority_reason}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Responsible Agency</span>
            <span className="text-sm font-bold text-slate-900">{workOrder?.agency_name || 'Assigned Municipal Unit'}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Assigned Team: {workOrder?.assigned_team || 'Pending Triage'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Target SLA Deadline</span>
            <SLACountdown createdAtIso={incident.first_reported_at} status={incident.status} />
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Issue Description</h3>
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            {incident.description}
          </p>
        </div>
      </div>

      {/* Geospatial Map Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <MapPin className="w-4 h-4 text-brand-600 mr-2" /> Geographic Incident Location
            </h3>
            <p className="text-xs text-slate-500">
              Coordinates: {incident.lat.toFixed(5)}° N, {incident.lng.toFixed(5)}° E
            </p>
          </div>
          <a
            href={getOpenStreetMapDirectionsUrl(incident.lat, incident.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto"
            title="Open in OpenStreetMap Directions"
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>Open in OpenStreetMap Directions</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="h-[380px] w-full rounded-xl overflow-hidden border border-slate-200">
          <CivicMap
            incidents={allIncidents}
            selectedIncidentId={incident.id}
            center={[incident.lat, incident.lng]}
            zoom={16}
            showSearch={false}
            showFilters={false}
          />
        </div>
      </div>

      {/* Field Evidence Gallery */}
      {evidenceList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <ImageIcon className="w-4 h-4 text-brand-600 mr-2" /> Attached Field Evidence Photos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {evidenceList.map(ev => (
              <div key={ev.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700 block w-max">
                  {ev.evidence_type.replace('_', ' ')}
                </span>
                <img src={ev.url} alt="Evidence" className="w-full h-40 object-cover rounded-lg border border-slate-300" />
                <span className="text-[10px] text-slate-400 block font-mono">Uploaded: {new Date(ev.uploaded_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Immutable Audit History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <History className="w-4 h-4 text-brand-600 mr-2" /> Accountability Audit Trail
          </h3>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            Immutable Audit Trail
          </span>
        </div>

        <div className="space-y-4">
          {auditEvents.length > 0 ? (
            auditEvents.map(event => (
              <div key={event.id} className="flex items-start space-x-3 text-xs border-l-2 border-brand-500 pl-4 py-1">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{event.action}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {event.actor_name} ({event.actor_role})
                    </span>
                  </div>
                  <p className="text-slate-600">{event.details}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No audit events recorded for this incident yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
