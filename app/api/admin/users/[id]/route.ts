import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { dbRepository } from '@/lib/db/repository';
import { UserRole } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id;

    // 1. Authenticate caller
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(sessionCookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Administrator privileges are required to modify user roles or account status.' },
        { status: 403 }
      );
    }

    // 2. Prevent user modifying own role (prevent lockouts and privilege escalation)
    const body = await request.json();
    const { role, active } = body;

    if (role && session.userId === targetUserId) {
      return NextResponse.json(
        { error: 'SELF_MODIFICATION_BLOCKED', message: 'Administrators cannot modify their own system role.' },
        { status: 400 }
      );
    }

    let updatedUser = await dbRepository.getUserById(targetUserId);
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User record not found.' },
        { status: 404 }
      );
    }

    // Update role if requested
    if (role) {
      const validRoles: UserRole[] = ['citizen', 'worker', 'officer', 'oversight', 'admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'INVALID_ROLE', message: `Invalid role: ${role}` },
          { status: 400 }
        );
      }
      updatedUser = await dbRepository.updateUserRole(targetUserId, role, session.userId, session.name);
    }

    // Toggle active status if requested
    if (typeof active === 'boolean') {
      updatedUser = await dbRepository.toggleUserStatus(targetUserId, active, session.userId, session.name);
    }

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser?.name} account successfully updated.`,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Failed to update user record.' },
      { status: 500 }
    );
  }
}
