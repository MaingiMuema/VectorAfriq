import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get messages for properties owned by the current user
    const sql = `
      SELECT m.*, p.title as propertyTitle
      FROM messages m
      LEFT JOIN property p ON m.propertyId = p.id
      WHERE p.userId = ?
      ORDER BY m.createdAt DESC
    `;

    const messages = await query(sql, [session.user.id]);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}