import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth/session';
import { getAuthorizedDashboardPath } from '@/lib/auth/rbac';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirm_password, phone, city_id, role } = body;

    // Security Check: Public registration MUST ALWAYS be citizen
    if (role && role !== 'citizen') {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED_ROLE',
          message:
            'Privileged municipal roles (Agency Officer, Field Worker, Supervisor, Administrator) cannot be self-registered. Only citizen accounts can be registered publicly.',
        },
        { status: 403 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Full name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Password must be at least 8 characters in length.' },
        { status: 400 }
      );
    }

    if (confirm_password && password !== confirm_password) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await dbRepository.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'USER_EXISTS', message: 'An account with this email address already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Register user in Supabase Auth if connected
    const supabase = createAdminClient();
    if (supabase) {
      const { error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { name: name.trim(), role: 'citizen' },
      });
      if (authError) {
        return NextResponse.json(
          { error: 'AUTH_CREATION_FAILED', message: authError.message },
          { status: 400 }
        );
      }
    }

    // Create user profile in database
    const newUser = await dbRepository.createUser({
      name: name.trim(),
      email: cleanEmail,
      role: 'citizen', // Enforced citizen role
      phone: phone?.trim() || undefined,
      city_id: city_id || 'city-delhi',
      active: true,
    });

    // Create session token and authenticate immediately
    const token = await createSessionToken(newUser, SESSION_DURATION_SECONDS);

    const response = NextResponse.json({
      success: true,
      message: 'Citizen account successfully created.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        city_id: newUser.city_id,
      },
      redirect: getAuthorizedDashboardPath(newUser.role),
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Registration processing error.' },
      { status: 500 }
    );
  }
}
