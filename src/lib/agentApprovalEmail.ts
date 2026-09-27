import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.vectorafriqproperties.co.ke',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

const FROM_ADDRESS = process.env.SMTP_FROM || 'VectorAfriq <noreply@vectorafriqproperties.co.ke>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vectorafriqproperties.co.ke';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function brandedTemplate(title: string, bodyHtml: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #514f63, #3d3b4e); padding: 32px 24px; text-align: center;">
        <img src="${SITE_URL}/vectorafriq-logo-removebg-preview.png" alt="VectorAfriq" style="height: 48px; width: auto; margin: 0 auto 8px; display: block;" />
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} VectorAfriq Kenya. All rights reserved.<br/>
          This email was sent from noreply@vectorafriqproperties.co.ke
        </p>
      </div>
    </div>
  `;
}

export async function sendAgentApprovalRequestToAdmin(params: {
  userName: string;
  userEmail: string;
  phone?: string;
  company?: string;
  licenseNumber?: string;
  experience?: string;
  specialization?: string;
  message?: string;
}) {
  try {
    const detailsHtml = [
      params.phone && `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> ${escapeHtml(params.phone)}</p>`,
      params.company && `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Company:</strong> ${escapeHtml(params.company)}</p>`,
      params.licenseNumber && `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>License #:</strong> ${escapeHtml(params.licenseNumber)}</p>`,
      params.experience && `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Experience:</strong> ${escapeHtml(params.experience)}</p>`,
      params.specialization && `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Specialization:</strong> ${escapeHtml(params.specialization)}</p>`,
    ].filter(Boolean).join('');

    const messageHtml = params.message
      ? `<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Applicant Message:</p>
          <p style="color: #374151; margin: 0; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
        </div>`
      : '';

    const html = brandedTemplate(
      'New Agent Approval Request',
      `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          A new user has requested to become a listed agent on VectorAfriq.
        </p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Applicant Details:</p>
          <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${escapeHtml(params.userName)}</p>
          <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${escapeHtml(params.userEmail)}</p>
          ${detailsHtml}
        </div>
        ${messageHtml}
        <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #9a3412; margin: 0; font-weight: 600;">Action Required</p>
          <p style="color: #9a3412; margin: 8px 0 0;">
            Please review this application in the admin dashboard and approve or reject it.
          </p>
        </div>
        <a href="${SITE_URL}/admin/users?tab=approvals" style="display: inline-block; background: #468AD1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
          Review Application
        </a>
      `
    );

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: process.env.ADMIN_EMAIL || 'admin@vectorafriqproperties.co.ke',
      subject: `New Agent Approval Request - ${escapeHtml(params.userName)} | VectorAfriq`,
      html,
    });

    return true;
  } catch (error) {
    console.error('[AGENT_APPROVAL_ADMIN_EMAIL]', error);
    return false;
  }
}

export async function sendAgentApprovalResultEmail(params: {
  to: string;
  userName: string;
  status: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}) {
  try {
    const isApproved = params.status === 'APPROVED';

    const notesHtml = params.reviewNotes
      ? `<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Admin Notes:</p>
          <p style="color: #374151; margin: 0; white-space: pre-wrap;">${params.reviewNotes}</p>
        </div>`
      : '';

    const nextStepsHtml = isApproved
      ? `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #166534; margin: 0; font-weight: 600;">You are now a VectorAfriq Agent!</p>
          <p style="color: #166534; margin: 8px 0 0;">
            You can now create property listings. Head to your dashboard to get started.
          </p>
        </div>
        <a href="${SITE_URL}/crm/create-listing" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
          Create Your First Listing
        </a>`
      : `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; margin: 0; font-weight: 600;">Application Not Approved</p>
          <p style="color: #991b1b; margin: 8px 0 0;">
            Unfortunately, your agent application was not approved at this time. You can update your profile and reapply, or contact our support team for more information.
          </p>
        </div>
        <a href="${SITE_URL}/crm/user-profile" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
          Update Profile & Reapply
        </a>`;

    const html = brandedTemplate(
      isApproved ? 'Agent Application Approved' : 'Agent Application Update',
      `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Hello <strong>${params.userName}</strong>,
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          ${isApproved
            ? 'Great news! Your application to become a VectorAfriq agent has been <strong>approved</strong>.'
            : 'We have reviewed your application to become a VectorAfriq agent, and unfortunately it was <strong>not approved</strong> at this time.'
          }
        </p>
        ${notesHtml}
        ${nextStepsHtml}
        <p style="color: #374151; line-height: 1.6; margin: 16px 0 0;">
          If you have any questions, please contact us at
          <a href="mailto:inquiry@vectorafriqproperties.co.ke" style="color: #468AD1;">inquiry@vectorafriqproperties.co.ke</a>.
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0;">
          Best regards,<br/>
          <strong>VectorAfriq Team</strong>
        </p>
      `
    );

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: params.to,
      subject: isApproved
        ? 'Your Agent Application Has Been Approved | VectorAfriq'
        : 'Agent Application Update | VectorAfriq',
      html,
    });

    return true;
  } catch (error) {
    console.error('[AGENT_APPROVAL_RESULT_EMAIL]', error);
    return false;
  }
}
