import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const messageId = request.url.split('/').pop();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Verify the message belongs to a property owned by the current user
    const verifySql = `
      SELECT m.id 
      FROM messages m
      LEFT JOIN property p ON m.propertyId = p.id
      WHERE m.id = ? AND p.userId = ?
    `;

    const verification = await query(verifySql, [messageId, session.user.id]);

    if (!verification || verification.length === 0) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    // Update message status
    const updateSql = `
      UPDATE messages 
      SET status = ?, updatedAt = NOW()
      WHERE id = ?
    `;

    await query(updateSql, [status, messageId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = request.url.split('/').pop();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Verify the message belongs to a property owned by the current user
    const verifySql = `
      SELECT m.id 
      FROM messages m
      LEFT JOIN property p ON m.propertyId = p.id
      WHERE m.id = ? AND p.userId = ?
    `;

    const verification = await query(verifySql, [messageId, session.user.id]);

    if (!verification || verification.length === 0) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    // Delete message
    const deleteSql = 'DELETE FROM messages WHERE id = ?';
    await query(deleteSql, [messageId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}