import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, confirm_password } = body;

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'New password must be at least 8 characters in length.' },
        { status: 400 }
      );
    }

    if (confirm_password && password !== confirm_password) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    // In Supabase mode:
    const supabase = createClient();
    if (supabase) {
      const { error: sbError } = await supabase.auth.updateUser({ password });
      if (sbError) {
        return NextResponse.json(
          { error: 'RESET_FAILED', message: sbError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated. Please sign in with your new password.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Password update failed.' },
      { status: 500 }
    );
  }
}
