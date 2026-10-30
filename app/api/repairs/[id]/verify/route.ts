import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/db/mock-store';
import { VerificationDecision } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workOrderId = params.id;
    const body = await request.json();
    const { decision, reason, reviewer_name } = body;

    if (!decision || !['APPROVED', 'REJECTED', 'NEEDS_MORE_EVIDENCE'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be APPROVED, REJECTED, or NEEDS_MORE_EVIDENCE' },
        { status: 400 }
      );
    }

    const reviewer = reviewer_name || 'Dr. Meera Iyer (State Oversight Director)';
    const updatedWO = mockStore.reviewWorkOrderVerification(
      workOrderId,
      decision as VerificationDecision,
      reason || 'Decision recorded via verification API',
      reviewer
    );

    if (!updatedWO) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      work_order: updatedWO,
      message: `Work order successfully updated to ${updatedWO.status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to submit verification review' },
      { status: 500 }
    );
  }
}
