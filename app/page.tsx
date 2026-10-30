import React from 'react';
import Link from 'next/link';
import { Shield, MapPin, PlusCircle, Layers, CheckCircle2, ArrowRight, Activity, FileText, AlertTriangle, Cpu } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative bg-navy-950 text-white pt-16 pb-20 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/30 text-brand-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>AI-Powered Civic Infrastructure & Accountability Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
                Every civic issue <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-emerald-400">
                  deserves action.
                </span> <br />
                Every action deserves <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                  accountability.
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                CivicPulse bridges citizen reporting with geospatial intelligence, multi-agency routing, evidence-based closure, and root-cause infrastructure dependency analysis across Indian municipalities.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <Link
                  href="/report"
                  className="w-full sm:w-auto px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
                >
                  <PlusCircle className="w-5 h-5 text-emerald-300" />
                  <span>Report Civic Hazard</span>
                </Link>

                <Link
                  href="/map"
                  className="w-full sm:w-auto px-7 py-3.5 bg-navy-800 hover:bg-navy-700 text-slate-100 font-bold text-sm rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all"
                >
                  <MapPin className="w-5 h-5 text-brand-400" />
                  <span>Explore Civic Map</span>
                </Link>
              </div>

              {/* Key Platform Stats */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-2xl font-black text-white font-mono">20+</div>
                  <div className="text-[11px] text-slate-400 font-medium">Mapped Incidents</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">94.2%</div>
                  <div className="text-[11px] text-slate-400 font-medium">SLA Resolution Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-400 font-mono">4 Agencies</div>
                  <div className="text-[11px] text-slate-400 font-medium">PWD, DJB, MCD, BSES</div>
                </div>
              </div>
            </div>

            {/* Right Hero Preview Card */}
            <div className="lg:col-span-5 bg-navy-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                  <Activity className="w-4 h-4 text-emerald-400 mr-2" /> Live Incident Pulse
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Active Demo Feed
                </span>
              </div>

              {/* Incident Feed Preview Item */}
              <div className="bg-navy-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-white">Blocked Storm Drain Line 4B</span>
                  <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded uppercase">CRITICAL</span>
                </div>
                <p className="text-xs text-slate-300">ITO Crossing, New Delhi | DJB Drainage Unit</p>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 font-mono">
                  <span>Priority Score: 91/100</span>
                  <span className="text-amber-400">SLA: 2h Remaining</span>
                </div>
              </div>

              <div className="bg-navy-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-white">Illegal Plastic Waste Accumulation</span>
                  <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded uppercase">HIGH</span>
                </div>
                <p className="text-xs text-slate-300">Vikas Marg under Ring Road | MCD Sanitation</p>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 font-mono">
                  <span className="text-teal-400">Pending Verification</span>
                  <span className="text-emerald-400">After Photo Attached</span>
                </div>
              </div>

              <Link
                href="/oversight/graph"
                className="block text-center text-xs font-bold text-brand-300 hover:text-brand-200 bg-brand-950/60 p-2.5 rounded-lg border border-brand-500/30 transition-colors"
              >
                View Root-Cause Dependency Graph →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CORE WORKFLOW CYCLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600">Complete Issue Lifecycle</h2>
          <h3 className="text-3xl font-extrabold text-slate-900">How CivicPulse Guarantees Action</h3>
          <p className="text-sm text-slate-600">From citizen report to independent evidence verification and preventive analysis.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">1</div>
            <h4 className="font-bold text-sm text-slate-900">1. Citizen Report & Duplicate Check</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Citizens select map location, upload evidence, and get instant duplicate detection.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">2</div>
            <h4 className="font-bold text-sm text-slate-900">2. Intelligent Multi-Agency Routing</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Matches city, jurisdiction, asset type, and category to assign responsible agency with priority score.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">3</div>
            <h4 className="font-bold text-sm text-slate-900">3. Field Dispatch & SLA Deadlines</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Field workers receive task dispatch, execute repairs, and submit mandatory after-work photo evidence.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">4</div>
            <h4 className="font-bold text-sm text-slate-900">4. Side-by-Side Verification & Audit</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Independent supervisor compares before/after photos. Approves closure or rejects with mandatory audit trail.</p>
          </div>
        </div>
      </section>

      {/* SIGNATURE DIFFERENTIATOR HIGHLIGHT */}
      <section className="bg-slate-900 text-white py-16 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Signature Differentiator</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white">Civic Infrastructure Dependency Graph</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Superficial fixes only address symptoms. CivicPulse connects contributing infrastructure failures into a root-cause chain:
              </p>
              <div className="bg-navy-950 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2 text-brand-300">
                <div>Single-Use Plastic Dumping ➔</div>
                <div className="pl-4">Blocked Stormwater Drain Line ➔</div>
                <div className="pl-8">Severe Arterial Road Waterlogging ➔</div>
                <div className="pl-12 text-rose-400 font-bold">Bitumen Erosion & Axle-Breaking Potholes</div>
              </div>
              <p className="text-xs text-slate-400">
                Solving the upstream waste problem prevents recurring road repair costs for the municipality.
              </p>
              <Link
                href="/oversight/graph"
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs rounded-xl transition-all"
              >
                <span>Explore Interactive Chain Visualizer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Visual Feature Card */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300 uppercase">Dependency Chain Analytics</span>
                <span className="text-[10px] text-amber-400 font-mono">Root Cause Solver</span>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
                  <span className="text-slate-400 block text-[10px]">UPSTREAM ROOT CAUSE</span>
                  <span className="font-bold text-white">Commercial Plastic Litter Dumping</span>
                  <span className="text-[11px] text-emerald-400 block mt-1">Responsible Agency: MCD Sanitation</span>
                </div>
                <div className="text-center text-amber-400 text-xs font-mono">↓ CAUSES (Confidence: 95%)</div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
                  <span className="text-slate-400 block text-[10px]">DOWNSTREAM SECONDARY HAZARD</span>
                  <span className="font-bold text-white">Knee-Deep Waterlogging & Potholes</span>
                  <span className="text-[11px] text-rose-400 block mt-1">Affected Agency: PWD & DJB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
