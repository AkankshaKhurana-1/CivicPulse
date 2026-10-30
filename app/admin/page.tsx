'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { mockStore } from '@/lib/db/mock-store';
import { PriorityConfig, User, UserRole } from '@/lib/types';
import { CivicMap } from '@/components/map/CivicMap';
import { useRole } from '@/components/dashboard/RoleContext';
import {
  Shield, RefreshCw, Layers, Database, CheckCircle2, Sliders,
  Users, Building, FileSpreadsheet, AlertTriangle, Save, Map as MapIcon,
  Activity, Sparkles, Wrench, Clock, ArrowRight, ExternalLink,
  Search, UserCheck, UserX, AlertCircle, Filter
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'map_overview' | 'intelligence' | 'priority_config' | 'cities_agencies' | 'users'>('overview');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { user: currentAuthUser } = useRole();
  const [adminUsers, setAdminUsers] = useState<User[]>(mockStore.getUsers());
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [userActionSuccess, setUserActionSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userRoleFilter && userRoleFilter !== 'all') params.set('role', userRoleFilter);
      if (userSearch.trim()) params.set('search', userSearch.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setAdminUsers(data.users);
          return;
        }
      }
    } catch {
      // Fallback
    }
    // Fallback filtering on mockStore
    let list = mockStore.getUsers();
    if (userRoleFilter && userRoleFilter !== 'all') {
      list = list.filter(u => u.role === userRoleFilter);
    }
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    setAdminUsers(list);
  }, [userRoleFilter, userSearch]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUserActionError(null);
    setUserActionSuccess(null);
    setUserActionLoading(userId);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserActionError(data.message || 'Failed to update user role.');
        return;
      }
      setUserActionSuccess(`Successfully updated role to ${newRole}.`);
      await fetchUsers();
      setTimeout(() => setUserActionSuccess(null), 3000);
    } catch {
      setUserActionError('Network error updating user role.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    setUserActionError(null);
    setUserActionSuccess(null);
    setUserActionLoading(userId);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserActionError(data.message || 'Failed to update user status.');
        return;
      }
      setUserActionSuccess(`User account status updated.`);
      await fetchUsers();
      setTimeout(() => setUserActionSuccess(null), 3000);
    } catch {
      setUserActionError('Network error updating account status.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const cities = mockStore.getCities();
  const jurisdictions = mockStore.getJurisdictions();
  const agencies = mockStore.getAgencies();
  const users = mockStore.getUsers();
  const allIncidents = mockStore.getIncidents();
  const infrastructureAssets = mockStore.getInfrastructureAssets();
  const repairMonitoringRecords = mockStore.getRepairMonitoringRecords();
  const recurrenceEvents = mockStore.getRecurrenceEvents();
  const rootCauseRecommendations = mockStore.getRootCauseRecommendations();
  const maintenanceInspections = mockStore.getMaintenanceInspections();
  const workOrders = mockStore.getWorkOrders();

  const [priorityConfig, setPriorityConfig] = useState<PriorityConfig>(mockStore.getPriorityConfig());

  const handleResetSeedData = () => {
    mockStore.reset();
    setPriorityConfig(mockStore.getPriorityConfig());
    setResetMessage('Demo database successfully re-seeded with 20+ fresh incidents and audit history.');
    setTimeout(() => setResetMessage(null), 4000);
  };

  const handleSavePriorityConfig = (e: React.FormEvent) => {
    e.preventDefault();
    mockStore.updatePriorityConfig(priorityConfig);
    setSaveMessage('Priority weights and emergency thresholds saved successfully.');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded">
            System Administration
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">CivicPulse Platform Governance</h1>
          <p className="text-xs text-slate-500">Manage city boundaries, agency responsibility matrices, and demo presentation reset tools.</p>
        </div>

        <button
          onClick={handleResetSeedData}
          className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5 shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-white" />
          <span>Reset Demo Seed Data</span>
        </button>
      </div>

      {resetMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{resetMessage}</span>
        </div>
      )}

      {saveMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('intelligence')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'intelligence'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-teal-400" />
          <span>Infrastructure Intelligence Center</span>
        </button>

        <button
          onClick={() => setActiveTab('map_overview')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'map_overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>City Geospatial Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('priority_config')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'priority_config'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Priority & Emergency Config</span>
        </button>

        <button
          onClick={() => setActiveTab('cities_agencies')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'cities_agencies'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Cities, Zones & Agencies</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Roles ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 block">Configured Cities</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">{cities.length}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 block">Jurisdiction Zones</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">{jurisdictions.length}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 block">Statutory Agencies</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">{agencies.length}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 block">Registered Users</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">{users.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Infrastructure Intelligence Center */}
      {activeTab === 'intelligence' && (
        <div className="space-y-8">
          {/* Section Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Infrastructure Failure DNA & Repair Accountability
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                Municipal Asset Failure Analytics & Contractor Accountability
              </h2>
              <p className="text-xs text-slate-300">
                Persistent physical asset tracking, post-repair recurrence monitoring, and rule-based engineering root cause detection.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-3 py-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-mono font-bold">
                Rule Engine: Active (Threshold: &ge;3 incidents, &ge;2 repairs)
              </span>
            </div>
          </div>

          {/* 6 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">Municipal Assets</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {infrastructureAssets.length}
              </div>
              <span className="text-[10px] text-slate-400">Tracked Physical IDs</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">Chronic Failures</span>
              <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                {infrastructureAssets.filter(a => a.is_chronic_failure).length}
              </div>
              <span className="text-[10px] text-rose-600 font-semibold">High Repeat Zones</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">60-Day Monitoring</span>
              <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                {repairMonitoringRecords.length || infrastructureAssets.filter(a => a.monitoring_status === 'REPAIRED_UNDER_MONITORING').length || 1}
              </div>
              <span className="text-[10px] text-slate-400">Active Post-Repair</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">Recurrences</span>
              <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                {recurrenceEvents.length}
              </div>
              <span className="text-[10px] text-slate-400">Failed Interventions</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">Pending Reviews</span>
              <div className="text-2xl font-black text-teal-600 font-mono mt-1">
                {workOrders.filter(w => w.status === 'COMPLETED_PENDING_VERIFICATION').length}
              </div>
              <span className="text-[10px] text-slate-400">Dual-Photo Audits</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500">Inspections Needed</span>
              <div className="text-2xl font-black text-purple-600 font-mono mt-1">
                {rootCauseRecommendations.length}
              </div>
              <span className="text-[10px] text-purple-600 font-semibold">Root Cause Advised</span>
            </div>
          </div>

          {/* Recurring Municipal Assets Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Tracked Municipal Infrastructure Failure DNA</h3>
                <p className="text-xs text-slate-500">
                  Persistent physical assets mapped with multi-cycle breakdown history and recurrence intervals.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                {infrastructureAssets.length} Assets Registered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-4">Asset Code & Type</th>
                    <th className="p-4">Physical Name & Location</th>
                    <th className="p-4 text-center">Failure Cycles</th>
                    <th className="p-4 text-center">Repairs Completed</th>
                    <th className="p-4 text-center">Recurrences</th>
                    <th className="p-4 text-center">Mean Recurrence</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Failure DNA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {infrastructureAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-900">{asset.asset_code}</div>
                        <div className="text-[11px] text-slate-500 uppercase font-semibold">{asset.infrastructure_type}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{asset.name}</div>
                        <div className="text-[11px] text-slate-500">{asset.address}</div>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-900">
                        {asset.failure_count}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-emerald-700">
                        {asset.repair_count}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-rose-700">
                        {asset.recurrence_count}
                      </td>
                      <td className="p-4 text-center font-mono text-slate-700">
                        {asset.average_recurrence_days ? `${asset.average_recurrence_days} days` : 'N/A'}
                      </td>
                      <td className="p-4">
                        {asset.is_chronic_failure ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                            <Activity className="w-3 h-3 text-rose-600" />
                            <span>Chronic Failure Zone</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {asset.monitoring_status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/infrastructure/${asset.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
                        >
                          <span>Inspect DNA</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Repair Effectiveness Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Department Repair Effectiveness Matrix</h3>
                <p className="text-xs text-slate-500">
                  Benchmarking contractor repair quality, supervisor rejection rates, and repeat failure probabilities.
                </p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
                Oversight Tier: Gold
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Municipal Agency / Department</th>
                    <th className="p-3 text-center">Work Orders Handled</th>
                    <th className="p-3 text-center">Verified Closures</th>
                    <th className="p-3 text-center">Evidence Rejection Rate</th>
                    <th className="p-3 text-center">Recurrence Rate</th>
                    <th className="p-3 text-center">Effectiveness Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Public Works Department (Highway & Roads)</td>
                    <td className="p-3 text-center font-mono">14</td>
                    <td className="p-3 text-center font-mono text-emerald-700 font-bold">11</td>
                    <td className="p-3 text-center font-mono text-rose-600 font-bold">14.2%</td>
                    <td className="p-3 text-center font-mono text-amber-600 font-bold">28.5%</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded font-bold">
                        71.5% (Needs Root-Cause Audit)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Municipal Corporation (Water Supply & Drainage)</td>
                    <td className="p-3 text-center font-mono">18</td>
                    <td className="p-3 text-center font-mono text-emerald-700 font-bold">16</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">5.5%</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">11.1%</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded font-bold">
                        88.9% (High Reliability)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Punjab State Power Corporation (Electricity Board)</td>
                    <td className="p-3 text-center font-mono">12</td>
                    <td className="p-3 text-center font-mono text-emerald-700 font-bold">11</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">8.3%</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">8.3%</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded font-bold">
                        91.7% (Exemplary)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Urban Sanitation & Solid Waste Authority</td>
                    <td className="p-3 text-center font-mono">22</td>
                    <td className="p-3 text-center font-mono text-emerald-700 font-bold">20</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">4.5%</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">9.0%</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded font-bold">
                        91.0% (Exemplary)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Geospatial Chronic Failure Map */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Geospatial Chronic Failure Hotspots</h3>
                <p className="text-xs text-slate-500">
                  Plotted incident density and recurring breakdown zones centered on Chandigarh University Highway corridor.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
                Hotspot: NH-95 Highway Corridor
              </span>
            </div>
            <div className="h-[380px] sm:h-[480px] w-full rounded-2xl overflow-hidden border border-slate-200">
              <CivicMap
                incidents={allIncidents}
                infrastructureAssets={infrastructureAssets}
                center={[30.7700, 76.5750]}
                zoom={14}
                showSearch={true}
                showFilters={true}
                showLegend={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: City Geospatial Operations */}
      {activeTab === 'map_overview' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>City-wide visualization of civic hazards, priority densities, and infrastructure maintenance across municipal zones.</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300 self-start sm:self-auto">
              {allIncidents.length} Platform Incidents
            </span>
          </div>
          <div className="h-[400px] sm:h-[520px] lg:h-[650px] w-full">
            <CivicMap
              incidents={allIncidents}
              infrastructureAssets={infrastructureAssets}
              showSearch={true}
              showFilters={true}
              showLegend={true}
            />
          </div>
        </div>
      )}

      {/* TAB 2: Priority Weights & Emergency Configuration */}
      {activeTab === 'priority_config' && (
        <form onSubmit={handleSavePriorityConfig} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">7-Factor Priority Weight Matrix</h3>
              <p className="text-xs text-slate-500">Adjust the relative points allocation totaling 100 points maximum.</p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>1. Issue Severity Weight:</span>
                  <span className="font-mono text-brand-600">{priorityConfig.weights.severity} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={priorityConfig.weights.severity}
                  onChange={e => setPriorityConfig({
                    ...priorityConfig,
                    weights: { ...priorityConfig.weights, severity: parseInt(e.target.value) || 25 },
                  })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>2. Public Safety & Impact Weight:</span>
                  <span className="font-mono text-brand-600">{priorityConfig.weights.safety_impact} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={priorityConfig.weights.safety_impact}
                  onChange={e => setPriorityConfig({
                    ...priorityConfig,
                    weights: { ...priorityConfig.weights, safety_impact: parseInt(e.target.value) || 25 },
                  })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>3. Infrastructure Importance Weight:</span>
                  <span className="font-mono text-brand-600">{priorityConfig.weights.infrastructure} pts</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={priorityConfig.weights.infrastructure}
                  onChange={e => setPriorityConfig({
                    ...priorityConfig,
                    weights: { ...priorityConfig.weights, infrastructure: parseInt(e.target.value) || 15 },
                  })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>4. Repeat-Failure Recurrence Weight:</span>
                  <span className="font-mono text-brand-600">{priorityConfig.weights.recurrence} pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={priorityConfig.weights.recurrence}
                  onChange={e => setPriorityConfig({
                    ...priorityConfig,
                    weights: { ...priorityConfig.weights, recurrence: parseInt(e.target.value) || 10 },
                  })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>5. Incident Age Weight:</span>
                  <span className="font-mono text-brand-600">{priorityConfig.weights.age} pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={priorityConfig.weights.age}
                  onChange={e => setPriorityConfig({
                    ...priorityConfig,
                    weights: { ...priorityConfig.weights, age: parseInt(e.target.value) || 10 },
                  })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>6. Independent Report Corroboration Weight:</span>
                  <span className="font-mono text-brand-600">{priorityConfig.weights.corroboration} pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={priorityConfig.weights.corroboration}
                  onChange={e => setPriorityConfig({
                    ...priorityConfig,
                    weights: { ...priorityConfig.weights, corroboration: parseInt(e.target.value) || 10 },
                  })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>7. Evidence Confidence Weight:</span>
                  <span className="font-mono text-brand-600">{priorityConfig.weights.evidence} pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={priorityConfig.weights.evidence}
                  onChange={e => setPriorityConfig({
                    ...priorityConfig,
                    weights: { ...priorityConfig.weights, evidence: parseInt(e.target.value) || 5 },
                  })}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Emergency Keywords */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-500 mr-1.5" /> Emergency Safety Override Triggers
            </h4>
            <p className="text-xs text-slate-500">
              Incidents containing any of these critical keywords automatically bypass standard weight accumulation and escalate to Score 100 (Critical):
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {priorityConfig.emergency_keywords.map((kw, idx) => (
                <span key={idx} className="bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-md font-mono">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Cities & Agencies */}
      {activeTab === 'cities_agencies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Configured Municipalities & Administrative Zones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cities.map(c => (
                <div key={c.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{c.name}, {c.state}</span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Active</span>
                  </div>
                  <p className="text-slate-500 font-mono">Center GPS: {c.lat}° N, {c.lng}° E</p>
                  <div className="text-slate-600 pt-1 border-t border-slate-200">
                    <span className="font-semibold block mb-1">Administrative Zones:</span>
                    <div className="flex flex-wrap gap-1">
                      {jurisdictions.filter(j => j.city_id === c.id).map(j => (
                        <span key={j.id} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                          {j.name} ({j.code})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Agency Responsibility Matrix</h3>
            <div className="space-y-3">
              {agencies.map(a => (
                <div key={a.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{a.name} ({a.code})</span>
                    <span className="text-[10px] font-mono text-slate-500">{a.contact_email}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {a.category_coverage.map(cat => (
                      <span key={cat} className="bg-brand-50 border border-brand-200 text-brand-800 px-2 py-0.5 rounded text-[10px] font-mono">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Role-Based Access Control (RBAC) Directory</h3>
              <p className="text-xs text-slate-500">
                Inspect municipal user profiles, update assigned roles with server verification, and manage account statuses.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{adminUsers.length}</strong> registered users
              </span>
            </div>
          </div>

          {/* Action alerts */}
          {userActionError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{userActionError}</span>
            </div>
          )}

          {userActionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{userActionSuccess}</span>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users by name or email address..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="all">All Roles (Any)</option>
                <option value="citizen">Citizen</option>
                <option value="officer">Agency Officer</option>
                <option value="worker">Field Worker</option>
                <option value="oversight">Supervisor (Oversight)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">User Identity</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Jurisdiction / Agency</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No user accounts match the selected search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  adminUsers.map(u => {
                    const isSelf = currentAuthUser?.id === u.id || u.email === currentAuthUser?.email;
                    const isActive = u.active !== false;
                    const isUpdating = userActionLoading === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-slate-900">{u.name}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-purple-100 border border-purple-200 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                                    You (Self)
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 font-mono text-[11px] block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <select
                            value={u.role}
                            disabled={isSelf || isUpdating}
                            onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                            className={`border rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer ${
                              isSelf
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                            }`}
                            title={isSelf ? 'Administrators cannot modify their own role' : 'Change user role'}
                          >
                            <option value="citizen">Citizen</option>
                            <option value="officer">Agency Officer</option>
                            <option value="worker">Field Worker</option>
                            <option value="oversight">Supervisor</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>

                        <td className="p-3.5">
                          <span className="text-slate-600 block">{u.city_id || 'Delhi MCD'}</span>
                          {u.agency_id && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Agency: {u.agency_id}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {isActive ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold text-[10px] uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-rose-700 font-bold text-[10px] uppercase bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" />
                              <span>Deactivated</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            disabled={isSelf || isUpdating}
                            onClick={() => handleToggleStatus(u.id, isActive)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              isSelf
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={isSelf ? 'Cannot toggle your own status' : 'Toggle active status'}
                          >
                            {isUpdating ? 'Saving...' : isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
