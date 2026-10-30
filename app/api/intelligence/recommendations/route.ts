import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/db/mock-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('asset_id');

    const recommendations = mockStore.getRootCauseRecommendations(assetId || undefined);

    return NextResponse.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
