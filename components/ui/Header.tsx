'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRole } from '../dashboard/RoleContext';
import {
  Shield,
  MapPin,
  PlusCircle,
  Search,
  Layers,
  Activity,
  BarChart2,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  ChevronDown,
  Building2,
  Wrench,
  ShieldCheck,
  Sliders,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { ROLE_LABELS, DASHBOARD_ROUTES } from '@/lib/auth/rbac';

const ROLE_BADGE_STYLES: Record<UserRole, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  citizen: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', icon: UserIcon },
  worker: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: Wrench },
  officer: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: Building2 },
  oversight: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: ShieldCheck },
  admin: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: Sliders },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, isAuthenticated, isLoading, selectedCityId, setSelectedCityId, logout, switchDemoPersona } = useRole();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (demoRef.current && !demoRef.current.contains(event.target as Node)) {
        setIsDemoMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardPath = (userRole: UserRole) => {
    return DASHBOARD_ROUTES[userRole] || '/citizen/dashboard';
  };

  const currentRoleStyle = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.citizen;
  const RoleIcon = currentRoleStyle.icon;

  const handleDemoSwitch = async (targetRole: UserRole) => {
    setIsDemoMenuOpen(false);
    await switchDemoPersona(targetRole);
    router.push(getDashboardPath(targetRole));
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg tracking-tight text-white">CivicPulse</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-200 border border-brand-500/30">
                    Smart Gov
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-none">
                  Infrastructure & Accountability Platform
                </p>
              </div>
            </Link>

            {/* City Selector */}
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-700/60">
              <MapPin className="w-3.5 h-3.5 text-brand-400 mr-1.5" />
              <select
                value={selectedCityId}
                onChange={e => setSelectedCityId(e.target.value)}
                className="bg-navy-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                aria-label="Select City"
              >
                <option value="city-delhi">New Delhi, MCD</option>
                <option value="city-mumbai">Mumbai, BMC</option>
                <option value="city-bengaluru">Bengaluru, BBMP</option>
                <option value="city-ludhiana">Ludhiana, Punjab</option>
              </select>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/map"
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/map' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Civic Map</span>
            </Link>

            <Link
              href="/issues"
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/issues' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Issue Explorer</span>
            </Link>

            <Link
              href="/report"
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/report' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Report Issue</span>
            </Link>

            <Link
              href="/oversight/graph"
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/oversight/graph' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Dependency Graph</span>
            </Link>

            <Link
              href="/oversight/analytics"
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/oversight/analytics' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-brand-300" />
              <span>Hotspots & SLAs</span>
            </Link>
          </nav>

          {/* Right Controls: Portal Link, Demo Persona Switcher & Auth Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Active Dashboard Shortcut */}
            {isAuthenticated && (
              <Link
                href={getDashboardPath(role)}
                className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold transition-all shadow-sm"
              >
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span className="capitalize">{ROLE_LABELS[role] || role} Portal</span>
              </Link>
            )}

            {/* Demo Quick Persona Switcher (clearly labeled for evaluator convenience) */}
            <div className="relative" ref={demoRef}>
              <button
                type="button"
                onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition"
                title="Switch demo persona for testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-[11px] font-semibold text-teal-300 capitalize">{role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isDemoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 backdrop-blur-xl">
                  <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Demo Persona Switcher
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Authenticates signed test session
                    </span>
                  </div>

                  {(['citizen', 'officer', 'worker', 'oversight', 'admin'] as UserRole[]).map(r => {
                    const style = ROLE_BADGE_STYLES[r];
                    const Icon = style.icon;
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleDemoSwitch(r)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                          isSelected ? 'bg-teal-500/10 text-teal-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                          <span className="capitalize">{r === 'oversight' ? 'Supervisor' : r}</span>
                        </div>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Authenticated User Menu OR Sign In / Register Buttons */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1 pl-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 transition"
                  aria-label="User Profile Menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div className="hidden sm:block text-left pr-1">
                    <span className="text-xs font-semibold text-white block leading-tight truncate max-w-[100px]">
                      {user.name?.split(' ')[0]}
                    </span>
                    <span className={`text-[10px] font-medium leading-none block capitalize ${currentRoleStyle.text}`}>
                      {role === 'oversight' ? 'Supervisor' : role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 pr-0.5" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 backdrop-blur-xl">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-950/60 border-slate-800">
                        <RoleIcon className={`w-3 h-3 ${currentRoleStyle.text}`} />
                        <span className="text-slate-300 capitalize">{ROLE_LABELS[role] || role}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href={getDashboardPath(role)}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                      >
                        <Activity className="w-4 h-4 text-teal-400" />
                        <span>Go to {ROLE_LABELS[role] || role} Dashboard</span>
                      </Link>

                      {role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                        >
                          <Sliders className="w-4 h-4 text-purple-400" />
                          <span>Admin User Directory</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsProfileOpen(false);
                          await logout();
                        }}
                        className="w-full text-left flex items-center space-x-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of CivicPulse</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/register"
                  className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
                >
                  <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition touch-target"
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-teal-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SLIDE-OUT NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-navy-950 border-l border-slate-800 shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-navy-900/90">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-base text-white tracking-tight">CivicPulse</span>
                  <span className="ml-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-200 border border-brand-500/30">
                    Smart Gov
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition touch-target"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* City Selector (Mobile) */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/60">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center">
                <MapPin className="w-3 h-3 text-brand-400 mr-1" />
                <span>Municipal Jurisdiction City</span>
              </label>
              <select
                value={selectedCityId}
                onChange={e => setSelectedCityId(e.target.value)}
                className="w-full bg-navy-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                aria-label="Select Municipal City"
              >
                <option value="city-delhi">New Delhi, MCD</option>
                <option value="city-mumbai">Mumbai, BMC</option>
                <option value="city-bengaluru">Bengaluru, BBMP</option>
                <option value="city-ludhiana">Ludhiana, Punjab</option>
              </select>
            </div>

            {/* Primary Platform Navigation */}
            <div className="p-4 border-b border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">
                Platform Navigation
              </span>

              <Link
                href="/map"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/map' ? 'bg-brand-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>Interactive Civic Map</span>
              </Link>

              <Link
                href="/issues"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/issues' ? 'bg-brand-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Civic Issue Explorer</span>
              </Link>

              <Link
                href="/report"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/report' ? 'bg-brand-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Report Civic Hazard</span>
              </Link>

              <Link
                href="/oversight/graph"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/oversight/graph' ? 'bg-brand-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Dependency Graph</span>
              </Link>

              <Link
                href="/oversight/analytics"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === '/oversight/analytics' ? 'bg-brand-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-brand-300" />
                <span>Hotspots & SLAs</span>
              </Link>
            </div>

            {/* Operational Role Portals */}
            <div className="p-4 border-b border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">
                Operational Portals
              </span>

              <Link
                href="/citizen/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                  pathname === '/citizen/dashboard' ? 'bg-teal-500/15 text-teal-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <UserIcon className="w-4 h-4 text-teal-400" />
                  <span>Citizen Command Center</span>
                </div>
                {role === 'citizen' && <span className="text-[9px] font-bold text-teal-400 bg-teal-500/20 px-1.5 py-0.2 rounded">Active</span>}
              </Link>

              <Link
                href="/worker/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                  pathname === '/worker/dashboard' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Field Worker Dispatch</span>
                </div>
                {role === 'worker' && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded">Active</span>}
              </Link>

              <Link
                href="/officer/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                  pathname === '/officer/dashboard' ? 'bg-blue-500/15 text-blue-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Agency Officer Queue</span>
                </div>
                {role === 'officer' && <span className="text-[9px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.2 rounded">Active</span>}
              </Link>

              <Link
                href="/oversight/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                  pathname === '/oversight/dashboard' ? 'bg-indigo-500/15 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Supervisor Verification</span>
                </div>
                {role === 'oversight' && <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.2 rounded">Active</span>}
              </Link>

              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                  pathname === '/admin' ? 'bg-purple-500/15 text-purple-300 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Administrator Governance</span>
                </div>
                {role === 'admin' && <span className="text-[9px] font-bold text-purple-400 bg-purple-500/20 px-1.5 py-0.2 rounded">Active</span>}
              </Link>
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-teal-400 mr-1" />
                <span>Switch Demo Persona</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['citizen', 'worker', 'officer', 'oversight', 'admin'] as UserRole[]).map(r => {
                  const style = ROLE_BADGE_STYLES[r];
                  const Icon = style.icon;
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await handleDemoSwitch(r);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold flex items-center space-x-1.5 border transition ${
                        isSelected
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                      <span className="capitalize truncate">{r === 'oversight' ? 'Supervisor' : r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Account / Sign Out / Sign In */}
            <div className="mt-auto p-4 bg-navy-900/90 border-t border-slate-800">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className={`text-[10px] font-semibold capitalize ${currentRoleStyle.text}`}>
                        {role === 'oversight' ? 'Supervisor' : role}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of CivicPulse</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
