'use client';

import React, { useState } from 'react';
import { mockStore } from '@/lib/db/mock-store';
import { WorkOrder, Incident } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { SLACountdown } from '@/components/dashboard/SLACountdown';
import { CivicMap } from '@/components/map/CivicMap';
import { getOpenStreetMapDirectionsUrl } from '@/components/map/MapConfig';
import {
  Wrench, CheckCircle2, Camera, Navigation, MapPin, Upload,
  List, Map as MapIcon, Compass
} from 'lucide-react';

export default function WorkerDashboardPage() {
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockStore.getWorkOrders());
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [notes, setNotes] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80'
  );

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO || !notes.trim()) return;
    mockStore.submitWorkOrderCompletion(
      selectedWO.id,
      notes,
      afterPhotoUrl,
      'Vikram Singh (Sanitation Lead)'
    );
    setWorkOrders([...mockStore.getWorkOrders()]);
    setSelectedWO(null);
    setNotes('');
  };

  // Get incident objects for the assigned work orders
  const assignedIncidents: Incident[] = workOrders
    .map(wo => mockStore.getIncidentById(wo.incident_id))
    .filter((inc): inc is Incident => inc !== undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded">
            Field Operations Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Field Worker Task Dispatch</h1>
          <p className="text-xs text-slate-500">
            View assigned tasks, navigate to coordinates, execute repairs, and submit mandatory after-work photo evidence.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Task Cards</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewMode === 'map' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Dispatch Map</span>
          </button>
        </div>
      </div>

      {/* View Mode: Field Dispatch Map */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Geospatial dispatch of your active assigned work orders with live GPS turn-by-turn directions.</span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 self-start sm:self-auto">
              {assignedIncidents.length} Assigned Locations
            </span>
          </div>
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full">
            <CivicMap incidents={assignedIncidents} showSearch={true} showFilters={true} />
          </div>
        </div>
      )}

      {/* View Mode: Task Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {workOrders.map(wo => {
            const incident = mockStore.getIncidentById(wo.incident_id);
            return (
              <div
                key={wo.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-900">{wo.reference_code}</span>
                    <PriorityBadge level={wo.priority_level} />
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{incident?.title || 'Municipal Task'}</h3>
                  <p className="text-xs text-slate-600">{incident?.description}</p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                      <div className="flex items-center space-x-1 text-slate-700 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{incident?.address}</span>
                      </div>
                      {incident && (
                        <a
                          href={getOpenStreetMapDirectionsUrl(incident.lat, incident.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-teal-600 hover:text-teal-800 font-semibold flex items-center space-x-0.5 shrink-0"
                          title="Navigate via OpenStreetMap"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>OSM Navigate</span>
                        </a>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      Assigned Team: {wo.assigned_team || 'Field Unit'}
                    </div>
                  </div>

                  <SLACountdown createdAtIso={wo.created_at} status={wo.status} />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
                  <StatusBadge status={wo.status} />
                  {wo.status !== 'COMPLETED_PENDING_VERIFICATION' && wo.status !== 'VERIFIED_CLOSED' && (
                    <button
                      onClick={() => setSelectedWO(wo)}
                      className="w-full xs:w-auto px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      <span>Submit Work Completion</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Modal */}
      {selectedWO && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleComplete} className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-900">Submit Work Order Completion</h3>
            <p className="text-xs text-slate-500">
              Work Order: <span className="font-mono font-bold text-slate-900">{selectedWO.reference_code}</span>
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Resolution Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe actions taken (e.g. Cleared 250kg of plastic packaging debris using loader truck)."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                After-Work Evidence Photo URL
              </label>
              <input
                type="url"
                value={afterPhotoUrl}
                onChange={e => setAfterPhotoUrl(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
                required
              />
              {afterPhotoUrl && (
                <div className="mt-2 w-32 h-24 rounded-lg overflow-hidden border border-slate-300">
                  <img src={afterPhotoUrl} alt="After-work preview" className="w-full h-full object-cover" />
                </div>
              )}
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
                className="w-full xs:w-auto px-5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Evidence for Verification</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
