'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockStore } from '@/lib/db/mock-store';
import { Report, Incident, Notification } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { CivicMap } from '@/components/map/CivicMap';
import {
  PlusCircle, MapPin, Calendar, Clock, RefreshCw, AlertTriangle,
  CheckCircle2, Bell, FileText, History, ExternalLink, ArrowRight, Map as MapIcon
} from 'lucide-react';

export default function CitizenDashboardPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'map' | 'notifications' | 'history'>('reports');
  const [reports, setReports] = useState<Report[]>(mockStore.getReports());
  const [notifications, setNotifications] = useState<Notification[]>(mockStore.getNotifications('usr-citizen-1'));
  const [reopenReason, setReopenReason] = useState('');
  const [reopenIncidentId, setReopenIncidentId] = useState<string | null>(null);

  const allIncidents = mockStore.getIncidents();
  const activeReports = reports.filter(r => r.status !== 'VERIFIED_CLOSED');
  const resolvedHistory = reports.filter(r => r.status === 'VERIFIED_CLOSED');
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    mockStore.markNotificationRead(id);
    setNotifications([...mockStore.getNotifications('usr-citizen-1')]);
  };

  const handleReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenIncidentId || !reopenReason.trim()) return;
    mockStore.reopenIssue(reopenIncidentId, reopenReason, 'Aarav Sharma');
    setReports([...mockStore.getReports()]);
    setReopenIncidentId(null);
    setReopenReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded">
            Citizen Operational Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Citizen Command Center</h1>
          <p className="text-xs text-slate-500">Track active issue lifecycles, review notifications, and verify field resolutions.</p>
        </div>

        <Link
          href="/report"
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow"
        >
          <PlusCircle className="w-4 h-4 text-emerald-300" />
          <span>Report New Hazard</span>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'reports'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Active Reports ({activeReports.length})</span>
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
          <span>Neighborhood Map</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all relative ${
            activeTab === 'notifications'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'history'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Resolved History ({resolvedHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: Active Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {activeReports.map(report => {
            const incident = report.linked_incident_id ? mockStore.getIncidentById(report.linked_incident_id) : undefined;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-brand-600 font-bold uppercase tracking-wider block">
                      Tracking Code: {report.reference_code}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{report.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {incident && <PriorityBadge level={incident.priority_level} />}
                    <StatusBadge status={report.status} />
                  </div>
                </div>

                <p className="text-xs text-slate-600">{report.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{report.address}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Accuracy: ±{report.gps_accuracy || 15}m</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Submitted: {new Date(report.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions & Reopen Option */}
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 pt-2">
                  <Link
                    href={`/issues/${report.linked_incident_id || report.id}`}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                  >
                    <span>Inspect Issue Audit Trail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {incident && incident.status !== 'REOPENED' && (
                    <button
                      onClick={() => setReopenIncidentId(incident.id)}
                      className="w-full xs:w-auto px-3.5 py-2 min-h-[38px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200 text-center"
                    >
                      Report Still Unresolved (Reopen)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: Neighborhood Map */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Explore reported hazards in your neighborhood, monitor verification progress, and search any Indian landmark.</span>
            <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 self-start sm:self-auto">
              {allIncidents.length} Incidents Mapped
            </span>
          </div>
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full">
            <CivicMap incidents={allIncidents} showSearch={true} showFilters={true} showLegend={true} />
          </div>
        </div>
      )}

      {/* TAB 2: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                notif.read ? 'bg-white border-slate-200' : 'bg-brand-50/50 border-brand-300 ring-1 ring-brand-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">{notif.title}</span>
                  {!notif.read && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-2 py-0.5 rounded">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{notif.message}</p>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {notif.link && (
                  <Link
                    href={notif.link}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
                {!notif.read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs rounded-lg font-medium"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Resolved History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {resolvedHistory.length > 0 ? (
            resolvedHistory.map(report => (
              <div key={report.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{report.title}</span>
                  <StatusBadge status="VERIFIED_CLOSED" />
                </div>
                <p className="text-xs text-slate-600">{report.description}</p>
                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Work verified closed by State Oversight. Solution evidence audited.</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic p-6 bg-white rounded-xl border border-slate-200">
              No closed reports in historical archive yet.
            </p>
          )}
        </div>
      )}

      {/* Reopen Modal */}
      {reopenIncidentId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleReopen} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Request Issue Reopening</h3>
            <p className="text-xs text-slate-600">Please explain why the hazard remains unresolved after completion:</p>
            <textarea
              value={reopenReason}
              onChange={e => setReopenReason(e.target.value)}
              placeholder="e.g. Water is still standing at 1 foot depth because the drain grating was not fully cleared."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
              required
            />
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setReopenIncidentId(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-lg shadow">Confirm Reopen</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
