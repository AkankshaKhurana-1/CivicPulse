import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-slate-800 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="sm:col-span-2">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">CivicPulse</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Every civic issue deserves action. Every action deserves accountability. CivicPulse connects citizen reporting with geospatial intelligence, multi-agency routing, evidence verification, and root-cause dependency tracking.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Row Level Security (RLS) & Privacy-safe location blurring enabled.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/map" className="hover:text-brand-400 transition-colors">Interactive Civic Map</Link></li>
              <li><Link href="/issues" className="hover:text-brand-400 transition-colors">Issue Explorer</Link></li>
              <li><Link href="/report" className="hover:text-brand-400 transition-colors">Submit Civic Report</Link></li>
              <li><Link href="/track" className="hover:text-brand-400 transition-colors">Track Report Code</Link></li>
              <li><Link href="/about" className="hover:text-brand-400 transition-colors">Platform Methodology & SLAs</Link></li>
            </ul>
          </div>

          {/* Role Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Operational Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/citizen/dashboard" className="hover:text-brand-400 transition-colors">Citizen Dashboard</Link></li>
              <li><Link href="/worker/dashboard" className="hover:text-brand-400 transition-colors">Field Worker Dispatch</Link></li>
              <li><Link href="/officer/dashboard" className="hover:text-brand-400 transition-colors">Agency Officer Queue</Link></li>
              <li><Link href="/oversight/dashboard" className="hover:text-brand-400 transition-colors">Oversight & Escalations</Link></li>
              <li><Link href="/oversight/graph" className="hover:text-brand-400 transition-colors">Dependency Graph</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 CivicPulse Technology Platform. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span className="text-amber-400/90 font-medium">Demo Mode — Configured with Sample Municipal Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
