import nodemailer from 'nodemailer';

// Transporter for noreply emails (report confirmations)
const noreplyTransporter = nodemailer.createTransport({
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

// Transporter for support emails (admin review notifications)
const supportTransporter = nodemailer.createTransport({
  host: process.env.SUPPORT_HOST || process.env.SMTP_HOST || 'mail.vectorafriqproperties.co.ke',
  port: parseInt(process.env.SUPPORT_PORT || process.env.SMTP_PORT || '465'),
  secure: (process.env.SUPPORT_PORT || process.env.SMTP_PORT) === '465',
  auth: {
    user: process.env.SUPPORT_USER || 'support@vectorafriqproperties.co.ke',
    pass: process.env.SUPPORT_PASS || process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

const NOREPLY_FROM = process.env.SMTP_FROM || 'VectorAfriq <noreply@vectorafriqproperties.co.ke>';
const SUPPORT_FROM = process.env.SUPPORT_FROM || 'VectorAfriq Support <support@vectorafriqproperties.co.ke>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vectorafriqproperties.co.ke';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function brandedTemplate(title: string, bodyHtml: string, fromAddress?: string) {
  const footerEmail = fromAddress === SUPPORT_FROM
    ? 'support@vectorafriqproperties.co.ke'
    : 'noreply@vectorafriqproperties.co.ke';

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
          This email was sent from ${footerEmail}
        </p>
      </div>
    </div>
  `;
}

/**
 * Send confirmation email to user after submitting a report
 */
export async function sendReportConfirmationEmail(params: {
  to: string;
  userName: string;
  propertyTitle: string;
  reason: string;
  description?: string | null;
}) {
  try {
    const descriptionHtml = params.description
      ? `<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Your Description:</p>
          <p style="color: #374151; margin: 0; white-space: pre-wrap;">${escapeHtml(params.description)}</p>
        </div>`
      : '';

    const html = brandedTemplate(
      'Report Received',
      `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Hello <strong>${escapeHtml(params.userName)}</strong>,
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Thank you for helping us keep VectorAfriq safe. We have received your report for the listing <strong>${escapeHtml(params.propertyTitle)}</strong>.
        </p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Report Details:</p>
          <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Reason:</strong> ${escapeHtml(params.reason)}</p>
          ${descriptionHtml}
        </div>
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #166534; margin: 0; font-weight: 600;">What happens next?</p>
          <p style="color: #166534; margin: 8px 0 0;">
            Our team will review your report and take appropriate action. You will receive an email notification once the review is complete.
          </p>
        </div>
        <p style="color: #374151; line-height: 1.6; margin: 16px 0 0;">
          If you have any further questions, please contact us at
          <a href="mailto:support@vectorafriqproperties.co.ke" style="color: #468AD1;">support@vectorafriqproperties.co.ke</a>.
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0;">
          Best regards,<br/>
          <strong>VectorAfriq Team</strong>
        </p>
      `
    );

    await noreplyTransporter.sendMail({
      from: NOREPLY_FROM,
      to: params.to,
      subject: `Report Received - ${escapeHtml(params.propertyTitle)} | VectorAfriq`,
      html,
    });

    return true;
  } catch (error) {
    console.error('[REPORT_CONFIRMATION_EMAIL]', error);
    return false;
  }
}

/**
 * Send notification email to reporter when admin reviews their report
 */
export async function sendReportReviewedEmail(params: {
  to: string;
  userName: string;
  propertyTitle: string;
  status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string | null;
}) {
  try {
    const isResolved = params.status === 'RESOLVED';
    const isDismissed = params.status === 'DISMISSED';

    const notesHtml = params.adminNotes
      ? `<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Admin Notes:</p>
          <p style="color: #374151; margin: 0; white-space: pre-wrap;">${escapeHtml(params.adminNotes)}</p>
        </div>`
      : '';

    const statusHtml = isResolved
      ? `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #166534; margin: 0; font-weight: 600;">Report Resolved</p>
          <p style="color: #166534; margin: 8px 0 0;">
            Your report for <strong>${escapeHtml(params.propertyTitle)}</strong> has been reviewed and resolved. Thank you for helping us maintain a safe platform.
          </p>
        </div>`
      : isDismissed
        ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0; font-weight: 600;">Report Dismissed</p>
            <p style="color: #991b1b; margin: 8px 0 0;">
              Your report for <strong>${escapeHtml(params.propertyTitle)}</strong> has been reviewed. After careful consideration, no action was taken at this time.
            </p>
          </div>`
        : `<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; font-weight: 600;">Report Reviewed</p>
            <p style="color: #1e40af; margin: 8px 0 0;">
              Your report for <strong>${escapeHtml(params.propertyTitle)}</strong> has been reviewed by our team. Thank you for your contribution.
            </p>
          </div>`;

    const html = brandedTemplate(
      'Report Update',
      `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Hello <strong>${escapeHtml(params.userName)}</strong>,
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          We wanted to update you on the report you submitted for the listing <strong>${escapeHtml(params.propertyTitle)}</strong>.
        </p>
        ${statusHtml}
        ${notesHtml}
        <p style="color: #374151; line-height: 1.6; margin: 16px 0 0;">
          If you have any further questions, please contact us at
          <a href="mailto:support@vectorafriqproperties.co.ke" style="color: #468AD1;">support@vectorafriqproperties.co.ke</a>.
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0;">
          Best regards,<br/>
          <strong>VectorAfriq Support Team</strong>
        </p>
      `,
      SUPPORT_FROM
    );

    await supportTransporter.sendMail({
      from: SUPPORT_FROM,
      to: params.to,
      subject: `Report ${params.status.toLowerCase()} - ${escapeHtml(params.propertyTitle)} | VectorAfriq`,
      html,
    });

    return true;
  } catch (error) {
    console.error('[REPORT_REVIEWED_EMAIL]', error);
    return false;
  }
}
