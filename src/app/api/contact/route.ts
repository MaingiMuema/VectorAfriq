import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, phone, message, propertyId } = await request.json();

    // Validate required fields
    if (!fullName || !email || !phone || !message || !propertyId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify property exists
    const propertyCheck = await query(
      'SELECT id FROM property WHERE id = ?',
      [propertyId]
    );

    if (!propertyCheck || propertyCheck.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Generate unique ID for the message using timestamp and random string
    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Insert message into database
    const insertSql = `
      INSERT INTO messages (id, fullName, email, phone, message, propertyId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'NEW', NOW(), NOW())
    `;

    await query(insertSql, [
      messageId,
      fullName,
      email,
      phone,
      message,
      propertyId
    ]);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Your inquiry has been sent successfully!',
        messageId 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}