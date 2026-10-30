import React from 'react';
import { MultiStepReportForm } from '@/components/reporting/MultiStepReportForm';

export default function ReportPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Submit a Civic Issue Report</h1>
        <p className="text-xs text-slate-600">
          Your report will be automatically checked for duplicate proximity, assigned a priority score, and routed to the responsible municipal agency.
        </p>
      </div>

      <MultiStepReportForm />
    </div>
  );
}
