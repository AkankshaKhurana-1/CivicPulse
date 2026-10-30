import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/db/mock-store';

export async function GET(request: NextRequest) {
  try {
    const assets = mockStore.getInfrastructureAssets();
    const chronicAssets = assets.filter(a => a.is_chronic_failure);
    const recurrenceEvents = mockStore.getRecurrenceEvents();
    const monitoringRecords = mockStore.getRepairMonitoringRecords();

    return NextResponse.json({
      success: true,
      summary: {
        total_assets: assets.length,
        chronic_failure_zones: chronicAssets.length,
        total_recurrence_events: recurrenceEvents.length,
        active_monitoring_records: monitoringRecords.length,
      },
      chronic_assets: chronicAssets,
      recurrence_events: recurrenceEvents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch recurring failure intelligence' },
      { status: 500 }
    );
  }
}
