import React from 'react';
import { ReportStatus, WorkOrderStatus, PriorityLevel } from '@/lib/types';
import { Clock, AlertTriangle, CheckCircle2, RefreshCw, XCircle, ArrowUpRight } from 'lucide-react';

interface StatusBadgeProps {
  status: ReportStatus | WorkOrderStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = status.replace(/_/g, ' ');
  let Icon = Clock;

  switch (status) {
    case 'SUBMITTED':
    case 'NEW':
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Submitted';
      Icon = Clock;
      break;
    case 'UNDER_TRIAGE':
    case 'TRIAGE':
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'In Triage';
      Icon = RefreshCw;
      break;
    case 'ASSIGNED':
      bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'Assigned';
      Icon = Clock;
      break;
    case 'IN_PROGRESS':
      bg = 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      label = 'In Progress';
      Icon = RefreshCw;
      break;
    case 'COMPLETED_PENDING_VERIFICATION':
      bg = 'bg-teal-50 text-teal-800 border-teal-300';
      label = 'Awaiting Verification';
      Icon = Clock;
      break;
    case 'VERIFIED_CLOSED':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      label = 'Verified Closed';
      Icon = CheckCircle2;
      break;
    case 'REJECTED':
    case 'REJECTED_COMPLETION':
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Evidence Rejected';
      Icon = XCircle;
      break;
    case 'REOPENED':
      bg = 'bg-orange-50 text-orange-800 border-orange-300';
      label = 'Reopened';
      Icon = AlertTriangle;
      break;
    case 'ESCALATED':
      bg = 'bg-red-50 text-red-700 border-red-300';
      label = 'Escalated';
      Icon = ArrowUpRight;
      break;
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center space-x-1 font-semibold rounded-full border ${bg} ${px}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="capitalize">{label}</span>
    </span>
  );
}

export function PriorityBadge({ level }: { level: PriorityLevel }) {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';

  if (level === 'CRITICAL') bg = 'bg-red-600 text-white border-red-700 font-bold';
  else if (level === 'HIGH') bg = 'bg-orange-500 text-white border-orange-600';
  else if (level === 'MEDIUM') bg = 'bg-amber-100 text-amber-800 border-amber-300';
  else if (level === 'LOW') bg = 'bg-slate-100 text-slate-600 border-slate-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase border ${bg}`}>
      {level}
    </span>
  );
}
