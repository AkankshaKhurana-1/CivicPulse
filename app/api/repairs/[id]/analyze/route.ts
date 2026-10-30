import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/db/mock-store';
import { analyzeRepairEvidence } from '@/lib/engines/repair-accountability';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workOrderId = params.id;
    const workOrder = mockStore.getWorkOrderById(workOrderId);

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const incident = mockStore.getIncidentById(workOrder.incident_id);
    if (!incident) {
      return NextResponse.json({ error: 'Linked incident not found' }, { status: 404 });
    }

    const evidenceList = mockStore.getEvidence(workOrderId);
    const initialEvidence =
      evidenceList.find(e => e.evidence_type === 'INITIAL_REPORT' || e.evidence_type === 'BEFORE_WORK') ||
      evidenceList[0];
    const afterEvidence =
      evidenceList.find(e => e.evidence_type === 'AFTER_WORK') ||
      evidenceList[evidenceList.length - 1];

    const allStoreEvidence = mockStore.getEvidence();
    const analysis = analyzeRepairEvidence(
      workOrderId,
      incident,
      initialEvidence,
      afterEvidence,
      allStoreEvidence
    );

    mockStore.saveRepairVerificationAnalysis(analysis);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze repair evidence' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const workOrderId = params.id;
  const analysis = mockStore.getRepairVerificationAnalysis(workOrderId);

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, analysis });
}
