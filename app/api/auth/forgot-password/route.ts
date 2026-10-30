import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Trigger Supabase Auth password reset email if configured
    const supabase = createClient();
    if (supabase) {
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/reset-password`,
      });
    }

    // Security practice: Never disclose whether the account exists or not
    return NextResponse.json({
      success: true,
      message:
        'If an account is associated with this email address, password reset instructions have been sent.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Password reset request failed.' },
      { status: 500 }
    );
  }
}
