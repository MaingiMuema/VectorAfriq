import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, reply, recipientEmail } = await request.json();

    // Verify the message belongs to a property owned by the current user
    const verifySql = `
      SELECT m.*, p.title as propertyTitle, p.userId
      FROM messages m
      LEFT JOIN property p ON m.propertyId = p.id
      WHERE m.id = ? AND p.userId = ?
    `;

    const messageData = await query(verifySql, [messageId, session.user.id]);

    if (!messageData || messageData.length === 0) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    const message = messageData[0];

    // Update message status to REPLIED
    const updateSql = `
      UPDATE messages 
      SET status = 'REPLIED', updatedAt = NOW()
      WHERE id = ?
    `;

    await query(updateSql, [messageId]);

    // Send email reply (if email configuration is available)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipientEmail,
          subject: `Re: Property Inquiry - ${message.propertyTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #468AD1;">Property Inquiry Reply</h2>
              <p>Dear ${message.fullName},</p>
              <p>Thank you for your inquiry about our property. Here's our response:</p>
              <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #468AD1; margin: 20px 0;">
                ${reply.replace(/\n/g, '<br>')}
              </div>
              <p>If you have any further questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>Property Team</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}