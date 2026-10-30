'use client';

import React, { useState } from 'react';
import { mockStore } from '@/lib/db/mock-store';
import { buildDependencyChain } from '@/lib/engines/dependency';
import { PriorityBadge } from '@/components/dashboard/StatusBadge';
import { Layers, ArrowDown, ShieldAlert, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function DependencyGraphPage() {
  const incidents = mockStore.getIncidents();
  const links = mockStore.getDependencyLinks();
  const chain = buildDependencyChain('inc-001', incidents, links);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-navy-900 text-white p-5 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-3">
        <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Signature Differentiator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Civic Infrastructure Dependency Graph</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Uncovers contributing root-cause chains connecting distinct civic problems across agencies. Demonstrates how resolving upstream waste issues prevents downstream road destruction.
        </p>
      </div>

      {/* Interactive Visual Chain Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">Root-Cause Infrastructure Chain Analysis</h3>
            <p className="text-xs text-slate-500">Node chain computed from ITO Corridor, New Delhi (DEL-CZ)</p>
          </div>
          <span className="text-xs font-mono font-bold bg-brand-50 border border-brand-200 text-brand-700 px-3 py-1 rounded-lg self-start sm:self-auto">
            4 Linked Incident Nodes
          </span>
        </div>

        {/* Chain Flow Visualization */}
        <div className="space-y-6 relative max-w-3xl mx-auto">
          {chain.map((node, index) => (
            <div key={node.incident.id} className="relative">
              {/* Connector Line */}
              {index > 0 && (
                <div className="flex flex-col items-center my-3 text-amber-600 font-mono text-xs font-bold space-y-1">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-brand-500 to-amber-500"></div>
                  <div className="bg-amber-50 border border-amber-300 text-amber-800 px-3 py-1 rounded-full text-[11px] shadow-sm flex items-center space-x-1">
                    <span>{node.relationFromParent || 'CAUSES'}</span>
                    <span className="text-[10px] text-slate-500">(Confidence: 95%)</span>
                  </div>
                  <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-brand-500"></div>
                </div>
              )}

              {/* Node Card */}
              <div className={`p-4 sm:p-6 rounded-2xl border-2 transition-all shadow-md ${
                index === 0
                  ? 'bg-amber-50/40 border-amber-400 ring-1 ring-amber-400/50'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded">
                      {node.incident.category.replace('_', ' ')}
                    </span>
                  </div>
                  <PriorityBadge level={node.incident.priority_level} />
                </div>

                <h4 className="font-extrabold text-base text-slate-900 mb-1">{node.incident.title}</h4>
                <p className="text-xs text-slate-600 mb-3">{node.incident.description}</p>

                {node.explanation && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono">
                    <span className="font-bold text-slate-900 block mb-0.5">Chain Mechanism Explanation:</span>
                    {node.explanation}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-[11px] text-slate-500">
                  <span>📍 {node.incident.address}</span>
                  <span className="font-mono">Priority Score: {node.incident.priority_score}/100</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preventive Maintenance Insight Box */}
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 text-xs text-brand-950 space-y-2">
          <h4 className="font-bold text-sm text-brand-900 flex items-center">
            <Sparkles className="w-4 h-4 text-brand-600 mr-2" /> Key Accountability Insight for Municipal Administrators
          </h4>
          <p className="leading-relaxed text-brand-900">
            Fixing the pothole (Node #4) costs ₹45,000 in asphalt patch materials every 3 months. However, the root cause is Node #1 (uncollected plastic waste choking the storm inlet). By deploying MCD Sanitation workers to clean Node #1 for ₹2,000, the municipality prevents recurring PWD road repair costs entirely.
          </p>
        </div>
      </div>
    </div>
  );
}
