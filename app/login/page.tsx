'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole } from '@/lib/types';
import {
  Shield,
  User,
  Building2,
  Wrench,
  ShieldCheck,
  Sliders,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Activity,
  Layers,
  MapPin,
} from 'lucide-react';

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'citizen',
    title: 'Citizen',
    description: 'Report civic problems, upload evidence, track complaints and receive updates.',
    icon: User,
    accentColor: 'border-teal-500 bg-teal-500/10 text-teal-400',
  },
  {
    role: 'officer',
    title: 'Agency Officer',
    description: 'Manage departmental complaints, assign work orders and monitor resolution.',
    icon: Building2,
    accentColor: 'border-blue-500 bg-blue-500/10 text-blue-400',
  },
  {
    role: 'worker',
    title: 'Field Worker',
    description: 'View assigned tasks, update progress and submit repair evidence.',
    icon: Wrench,
    accentColor: 'border-amber-500 bg-amber-500/10 text-amber-400',
  },
  {
    role: 'oversight',
    title: 'Supervisor',
    description: 'Review repair evidence, verify completed work and monitor accountability.',
    icon: ShieldCheck,
    accentColor: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
  },
  {
    role: 'admin',
    title: 'Administrator',
    description: 'Manage cities, users, agencies, permissions and platform analytics.',
    icon: Sliders,
    accentColor: 'border-purple-500 bg-purple-500/10 text-purple-400',
  },
];

const DEMO_ACCOUNTS = [
  { role: 'citizen' as UserRole, name: 'Aarav Sharma', email: 'aarav.sharma@example.com' },
  { role: 'officer' as UserRole, name: 'Sanjay Gupta', email: 's.gupta@pwd.delhi.gov.in' },
  { role: 'worker' as UserRole, name: 'Rajesh Kumar', email: 'rajesh.k@pwd.delhi.gov.in' },
  { role: 'oversight' as UserRole, name: 'Dr. Meera Iyer', email: 'm.iyer@oversight.gov.in' },
  { role: 'admin' as UserRole, name: 'CivicPulse Admin', email: 'admin@civicpulse.org' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check url search params for feedback
    const reason = searchParams.get('reason');
    const errorParam = searchParams.get('error');

    if (reason === 'unauthenticated') {
      setInfoMessage('Please sign in to access your secure municipal dashboard.');
    } else if (errorParam === 'unauthorized_role') {
      const attempted = searchParams.get('attempted');
      setErrorMessage(
        `Access Restricted: Your verified role does not have authorization to access ${attempted || 'that workspace'}.`
      );
    }
  }, [searchParams]);

  const handleSelectDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword('CivicPulse@2026');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          selected_role: selectedRole,
          remember_me: rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      // Check for redirect param
      const redirectUrl = searchParams.get('redirect') || data.redirect;
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network connection error during sign in.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* LEFT SIDE: Brand & Value Highlights */}
      <div className="lg:w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-navy-900 p-6 sm:p-10 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden shrink-0">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6 lg:space-y-8 relative z-10">
          {/* Logo & Product Name */}
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-brand-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-white">CivicPulse</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Government Edition
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Smart City Municipal Governance Platform</p>
            </div>
          </Link>

          {/* Tagline & Intro */}
          <div className="space-y-2 lg:space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Building Smarter, Safer and More Accountable Cities.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              One intelligent platform connecting citizens, authorities and field teams to ensure civic problems are resolved, verified and prevented.
            </p>
          </div>

          {/* Smart City Platform Metric Card (Visible on desktop & tablet, streamlined on mobile) */}
          <div className="hidden sm:block bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Municipal Intelligence Core
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% RBAC Secured
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-base sm:text-lg font-black text-white font-mono">5 Roles</div>
                <div className="text-[10px] text-slate-400">Enforced Access</div>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-base sm:text-lg font-black text-teal-300 font-mono">60 Days</div>
                <div className="text-[10px] text-slate-400">Repair Audit</div>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-base sm:text-lg font-black text-brand-300 font-mono">DNA Map</div>
                <div className="text-[10px] text-slate-400">Failure Tracking</div>
              </div>
            </div>
          </div>

          {/* 3 Short Highlights (Desktop only to prevent pushing login form below fold on mobile) */}
          <div className="hidden lg:block space-y-3">
            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Report and Track Civic Issues</strong>
                <span>Real-time citizen reporting with automated GPS geocoding and priority calculation.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Verify Repair Accountability</strong>
                <span>AI computer-vision before/after photographic audit and supervisor verification.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Prevent Recurring Infrastructure Failures</strong>
                <span>Failure DNA identity tracking, post-repair monitoring, and root-cause engineering reviews.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="hidden lg:flex mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 items-center justify-between relative z-10">
          <span>&copy; 2026 CivicPulse Platform.</span>
          <span className="font-mono">Security Tier 1</span>
        </div>
      </div>

      {/* RIGHT SIDE: Centralized Role Selection & Authentication Form */}
      <div className="lg:w-7/12 bg-slate-900 p-4 sm:p-8 lg:p-14 flex items-center justify-center">
        <div className="max-w-xl w-full space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">Welcome Back</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in to access your authorized CivicPulse workspace.
            </p>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* ROLE SELECTION CARDS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Your Workspace Role
              </label>
              <span className="text-[10px] sm:text-[11px] text-slate-500">
                Verified server-side
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {ROLES.map(r => {
                const isSelected = selectedRole === r.role;
                const IconComponent = r.icon;
                const isLastOnMobile = r.role === 'admin';
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.role);
                      setErrorMessage(null);
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between touch-target ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/30 shadow-md'
                        : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-700'
                    } ${isLastOnMobile ? 'col-span-2 sm:col-span-1 lg:col-span-1' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-teal-400 ring-4 ring-teal-400/20" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white leading-tight">{r.title}</div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1 sm:line-clamp-2">
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300" htmlFor="email-input">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@civicpulse.org"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-3 sm:py-2.5 min-h-[44px] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300" htmlFor="password-input">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-teal-400 hover:text-teal-300 transition py-1"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-3 sm:py-2.5 min-h-[44px] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white touch-target transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me option */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-500/30 w-4 h-4"
                />
                <span>Remember this workstation session (30 days)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-3 min-h-[46px] bg-gradient-to-r from-teal-500 to-brand-600 hover:from-teal-400 hover:to-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 touch-target"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Role & Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {ROLES.find(r => r.role === selectedRole)?.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Development & Demo Quick Login</span>
              </span>
              <span className="text-[10px] text-slate-500">1-Click Test Personas</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    selectedRole === acc.role && email === acc.email
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="font-semibold capitalize">{acc.role}:</span> {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Link to Register */}
          <div className="text-center text-xs text-slate-400 pt-2">
            Don't have a citizen account?{' '}
            <Link href="/register" className="text-teal-400 font-bold hover:text-teal-300 underline">
              Create a Citizen Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3">
          <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <span>Loading CivicPulse Authentication Authority...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
