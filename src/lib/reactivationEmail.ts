import nodemailer from 'nodemailer';

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

const SUPPORT_TO = 'support@vectorafriqproperties.co.ke';
const SUPPORT_FROM =
  process.env.SUPPORT_FROM || 'VectorAfriq Support <support@vectorafriqproperties.co.ke>';
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
          This email was sent to support@vectorafriqproperties.co.ke
        </p>
      </div>
    </div>
  `;
}

/**
 * Notify support when a deactivated user appeals for account reactivation.
 */
export async function sendReactivationAppealEmail(params: {
  userName?: string | null;
  userEmail: string;
  userId?: string | null;
  message?: string | null;
  role?: string | null;
}): Promise<boolean> {
  try {
    const messageHtml = params.message
      ? `<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Appeal Message:</p>
          <p style="color: #374151; margin: 0; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
        </div>`
      : '';

    const html = brandedTemplate(
      'Account Reactivation Appeal',
      `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          A user with a deactivated account has submitted a reactivation appeal.
        </p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">User Details:</p>
          <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Name:</strong> ${escapeHtml(params.userName || 'Not provided')}</p>
          <p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${escapeHtml(params.userEmail)}</p>
          ${params.userId ? `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>User ID:</strong> ${escapeHtml(params.userId)}</p>` : ''}
          ${params.role ? `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>Role:</strong> ${escapeHtml(params.role)}</p>` : ''}
        </div>
        ${messageHtml}
        <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #9a3412; margin: 0; font-weight: 600;">Action Required</p>
          <p style="color: #9a3412; margin: 8px 0 0;">
            Review this user in User Management and reactivate the account if appropriate.
          </p>
        </div>
        <a href="${SITE_URL}/admin/users" style="display: inline-block; background: #468AD1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
          Open User Management
        </a>
        <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">
          You can reply directly to this email to contact the user at
          <a href="mailto:${escapeHtml(params.userEmail)}" style="color: #468AD1;">${escapeHtml(params.userEmail)}</a>.
        </p>
      `
    );

    await supportTransporter.sendMail({
      from: SUPPORT_FROM,
      to: SUPPORT_TO,
      replyTo: params.userEmail,
      subject: `Account Reactivation Appeal - ${params.userEmail} | VectorAfriq`,
      html,
    });

    return true;
  } catch (error) {
    console.error('[REACTIVATION_APPEAL_EMAIL]', error);
    return false;
  }
}
