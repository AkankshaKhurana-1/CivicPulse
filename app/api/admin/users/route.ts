import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { dbRepository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate caller
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(sessionCookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrator privileges are required to access user records.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('search')?.toLowerCase().trim();

    let users = await dbRepository.getUsers();

    if (roleFilter && roleFilter !== 'ALL') {
      users = users.filter(u => u.role === roleFilter);
    }

    if (search) {
      users = users.filter(
        u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Failed to retrieve users.' },
      { status: 500 }
    );
  }
}
