import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth/session';
import { getAuthorizedDashboardPath, ROLE_LABELS } from '@/lib/auth/rbac';
import { UserRole } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, selected_role, remember_me } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Password is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user by email from trusted database
    const user = await dbRepository.getUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.active === false) {
      return NextResponse.json(
        {
          error: 'ACCOUNT_DEACTIVATED',
          message: 'This municipal user account has been deactivated. Please contact platform administration.',
        },
        { status: 403 }
      );
    }

    // 2. Validate Password
    // In live Supabase mode:
    const supabase = createClient();
    if (supabase) {
      const { error: sbError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (sbError) {
        return NextResponse.json(
          { error: 'INVALID_CREDENTIALS', message: sbError.message || 'Invalid email or password.' },
          { status: 401 }
        );
      }
    } else {
      // Demo / development mode authentication verification
      // All demo seed users accept standard password (e.g. "CivicPulse@2026" or any non-empty password in demo mode)
      if (password.length < 4) {
        return NextResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
          { status: 401 }
        );
      }
    }

    // 3. Verify selected role against trusted database role
    if (selected_role && typeof selected_role === 'string') {
      const targetRole = selected_role.toLowerCase() as UserRole;
      if (targetRole !== user.role) {
        const actualLabel = ROLE_LABELS[user.role] || user.role;
        const selectedLabel = ROLE_LABELS[targetRole] || selected_role;
        return NextResponse.json(
          {
            error: 'ROLE_MISMATCH',
            message: `Role mismatch: Your account is registered as ${actualLabel}. You cannot sign in through the ${selectedLabel} portal.`,
            actual_role: user.role,
            expected_role: targetRole,
          },
          { status: 403 }
        );
      }
    }

    // 4. Create signed session token
    const duration = remember_me ? SESSION_DURATION_SECONDS * 4 : SESSION_DURATION_SECONDS;
    const token = await createSessionToken(user, duration);

    // 5. Construct response with HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city_id: user.city_id,
      },
      redirect: getAuthorizedDashboardPath(user.role),
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: duration,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Authentication processing error.' },
      { status: 500 }
    );
  }
}
