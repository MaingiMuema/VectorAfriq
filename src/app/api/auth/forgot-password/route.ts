import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [user] = await query<{ id: string; name: string | null; email: string }>(
      'SELECT id, name, email FROM user WHERE email = ?',
      [email]
    );

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const id = uuidv4().replace(/-/g, '');

    // Delete any existing tokens for this email
    await query(
      'DELETE FROM password_reset_token WHERE email = ?',
      [email]
    );

    // Insert new token
    await query(
      'INSERT INTO password_reset_token (id, email, token, expires, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [id, email, token, expires]
    );

    // Send email
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
      await emailService.sendPasswordResetEmail(email, user.name ?? '', resetUrl);
    } catch (emailError) {
      // Don't fail the request if email fails, but log it
      console.error('Failed to send password reset email:', emailError);
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
