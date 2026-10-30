'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cityId, setCityId] = useState('city-delhi');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { score, label: 'Weak', color: 'bg-rose-500' };
      case 3:
      case 4:
        return { score, label: 'Good', color: 'bg-amber-500' };
      case 5:
        return { score, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'Weak', color: 'bg-rose-500' };
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the CivicPulse Community Terms & Privacy Policy to proceed.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          city_id: cityId,
          password,
          confirm_password: confirmPassword,
          role: 'citizen', // Enforced role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'Registration failed. Please check your inputs.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Citizen account created successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        router.push(data.redirectUrl || '/citizen/dashboard');
      }, 1000);
    } catch {
      setErrorMessage('Network error connecting to authentication server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Left Branding / Civic Info Panel */}
      <div className="lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 sm:p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Subtle decorative grid/glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6 sm:mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block">
                CIVIC<span className="text-teal-400">PULSE</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
                Citizen Portal Enrollment
              </span>
            </div>
          </Link>

          <div className="space-y-3 sm:space-y-4 max-w-md">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Public Citizen Registration</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Empower your city. <br />
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Report, track, and verify.
              </span>
            </h1>

            <p className="text-slate-400 text-xs leading-relaxed">
              Register as a resident to submit geo-verified civic reports, receive real-time repair
              milestone notifications, rate repair accountability, and participate directly in municipal governance.
            </p>
          </div>

          <div className="hidden lg:block mt-8 space-y-3 max-w-md">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center space-x-2 text-teal-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>AI-Assisted Geo-Verification</span>
              </div>
              <p className="text-slate-400 text-[11px] pl-6">
                Reports automatically match street-level GPS markers and detect duplicate submissions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center space-x-2 text-teal-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Transparent Repair DNA</span>
              </div>
              <p className="text-slate-400 text-[11px] pl-6">
                Inspect before-and-after photographic evidence verified with cryptographic integrity.
              </p>
            </div>
          </div>
        </div>

        {/* Notice for municipal officers */}
        <div className="hidden lg:block relative z-10 mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-start space-x-3 text-slate-400 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-300 block">Municipal Staff & Officers:</span>
              <p className="text-[11px] leading-relaxed">
                Agency Officers, Field Workers, Supervisors, and Administrators are provisioned
                directly by municipal authorities. If you already have credentials, please{' '}
                <Link href="/login" className="text-teal-400 underline hover:text-teal-300 font-medium">
                  sign in here
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:w-7/12 p-4 sm:p-8 lg:p-12 flex items-center justify-center bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-lg space-y-5 sm:space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Create your Citizen Account</h2>
            <p className="text-xs text-slate-400">
              Fill in your details below to activate your civic dashboard and notification alerts.
            </p>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300" htmlFor="name-input">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
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
                  placeholder="priya.sharma@example.com"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  required
                />
              </div>
            </div>

            {/* Phone & Municipality Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300" htmlFor="phone-input">
                  Mobile Number <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="phone-input"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300" htmlFor="city-select">
                  Municipal Jurisdiction
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="city-select"
                    value={cityId}
                    onChange={e => setCityId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  >
                    <option value="city-delhi">Municipal Corporation of Delhi (MCD)</option>
                    <option value="city-mumbai">Brihanmumbai Municipal Corp (BMC)</option>
                    <option value="city-bengaluru">Bruhat Bengaluru Mahanagara Palike (BBMP)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300" htmlFor="password-input">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className="font-semibold text-slate-300">{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300" htmlFor="confirm-password-input">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-10 py-3 sm:py-2.5 min-h-[44px] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  required
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start space-x-2 pt-1">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500/30 w-4 h-4"
              />
              <label htmlFor="terms-checkbox" className="text-[11px] text-slate-400 cursor-pointer select-none leading-relaxed">
                I agree to the CivicPulse Community Code of Conduct and acknowledge that civic reports are
                recorded with geographical metadata for municipal service delivery.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-3 min-h-[46px] bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 touch-target"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enrolling Citizen Account...</span>
                </>
              ) : (
                <>
                  <span>Create Citizen Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-400 font-bold hover:text-teal-300 underline">
              Sign In to Your Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
