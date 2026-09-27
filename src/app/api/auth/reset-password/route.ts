import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Valid token is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find the token
    const [resetToken] = await query(
      'SELECT * FROM password_reset_token WHERE token = ? AND used = false AND expires > NOW()',
      [token]
    );

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await query(
      'UPDATE user SET password = ?, updatedAt = NOW() WHERE email = ?',
      [hashedPassword, resetToken.email]
    );

    // Mark token as used
    await query(
      'UPDATE password_reset_token SET used = true WHERE token = ?',
      [token]
    );

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




