import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/db/mock-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = params.id;
    const asset = mockStore.getInfrastructureAssetById(assetId);

    if (!asset) {
      return NextResponse.json({ error: 'Infrastructure asset not found' }, { status: 404 });
    }

    const linkedIncidents = mockStore
      .getIncidents()
      .filter(i => asset.linked_incident_ids.includes(i.id) || i.infrastructure_asset_id === asset.id);

    const incidentIds = linkedIncidents.map(i => i.id);
    const linkedWorkOrders = mockStore
      .getWorkOrders()
      .filter(w => incidentIds.includes(w.incident_id) || w.infrastructure_asset_id === asset.id);

    const woIds = linkedWorkOrders.map(w => w.id);
    const linkedEvidence = mockStore
      .getEvidence()
      .filter(e => e.work_order_id && woIds.includes(e.work_order_id));

    const recurrenceEvents = mockStore.getRecurrenceEvents(asset.id);
    const recommendations = mockStore.getRootCauseRecommendations(asset.id);
    const inspections = mockStore.getMaintenanceInspections(asset.id);

    return NextResponse.json({
      success: true,
      asset,
      incidents: linkedIncidents,
      work_orders: linkedWorkOrders,
      evidence: linkedEvidence,
      recurrence_events: recurrenceEvents,
      recommendations,
      inspections,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch asset profile' },
      { status: 500 }
    );
  }
}
