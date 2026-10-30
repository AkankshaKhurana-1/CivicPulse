import { NextRequest, NextResponse } from 'next/server';
import { mockStore } from '@/lib/db/mock-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isChronic = searchParams.get('chronic');

    let assets = mockStore.getInfrastructureAssets();

    if (category) {
      assets = assets.filter(a => a.category === category);
    }

    if (isChronic === 'true') {
      assets = assets.filter(a => a.is_chronic_failure);
    }

    return NextResponse.json({
      success: true,
      count: assets.length,
      assets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch infrastructure assets' },
      { status: 500 }
    );
  }
}
