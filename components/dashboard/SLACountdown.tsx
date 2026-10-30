import React from 'react';
import { calculateSLADeadline } from '@/lib/engines/priority';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SLACountdownProps {
  createdAtIso: string;
  resolutionHours?: number;
  status: string;
}

export function SLACountdown({ createdAtIso, resolutionHours = 24, status }: SLACountdownProps) {
  if (status === 'VERIFIED_CLOSED') {
    return (
      <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-semibold">Resolved within SLA Target</span>
      </div>
    );
  }

  const { isBreached, hoursRemaining, dueIso } = calculateSLADeadline(createdAtIso, resolutionHours);
  const dueFormatted = new Date(dueIso).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isBreached) {
    return (
      <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
        <div>
          <span className="font-bold">SLA BREACHED:</span> Overdue by {Math.abs(hoursRemaining)} hours
          <span className="text-[11px] text-red-600 block">Due date was: {dueFormatted}</span>
        </div>
      </div>
    );
  }

  const isUrgent = hoursRemaining <= 6;

  return (
    <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border ${
      isUrgent ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
    }`}>
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`} />
      <div>
        <span className="font-semibold">{hoursRemaining}h remaining</span> before SLA target
        <span className="text-[11px] text-slate-500 block">Target resolution: {dueFormatted}</span>
      </div>
    </div>
  );
}
