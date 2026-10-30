import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/db/mock-store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recommendationId = params.id;
    const body = await request.json().catch(() => ({}));
    const scheduledDate =
      body.scheduled_date ||
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expertNotes = body.expert_notes;

    const inspection = mockStore.convertRecommendationToInspection(
      recommendationId,
      scheduledDate,
      expertNotes
    );

    if (!inspection) {
      return NextResponse.json(
        { error: 'Recommendation not found or already converted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      inspection,
      message: `Recommendation successfully converted to Engineering Inspection #${inspection.id}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to convert recommendation to inspection' },
      { status: 500 }
    );
  }
}
