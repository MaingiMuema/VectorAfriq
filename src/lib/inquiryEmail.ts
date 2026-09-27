import nodemailer from 'nodemailer';

const inquiryTransporter = nodemailer.createTransport({
  host: process.env.INQUIRY_HOST || 'mail.vectorafriqproperties.co.ke',
  port: parseInt(process.env.INQUIRY_PORT || '465'),
  secure: process.env.INQUIRY_PORT === '465',
  auth: {
    user: process.env.INQUIRY_USER || 'inquiry@vectorafriqproperties.co.ke',
    pass: process.env.INQUIRY_PASS || '1nqu1ry@Vector',
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

const FROM_ADDRESS = process.env.INQUIRY_FROM || 'VectorAfriq <inquiry@vectorafriqproperties.co.ke>';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vectorafriqproperties.co.ke';

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
          © ${new Date().getFullYear()} VectorAfriq Kenya. All rights reserved.<br/>
          This email was sent from inquiry@vectorafriqproperties.co.ke
        </p>
      </div>
    </div>
  `;
}

export async function sendInquiryConfirmationEmail(params: {
  to: string;
  name: string;
  serviceType: string;
  servicePage: string;
  extraFields?: Record<string, string>;
}) {
  try {
    const serviceLabel = params.servicePage
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const extraFieldsHtml = params.extraFields && Object.keys(params.extraFields).length > 0
      ? `
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 8px;">Additional Details:</p>
          ${Object.entries(params.extraFields)
            .filter(([, v]) => v)
            .map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
              return `<p style="color: #374151; margin: 4px 0; font-size: 14px;"><strong>${label}:</strong> ${value}</p>`;
            })
            .join('')}
        </div>
      `
      : '';

    const html = brandedTemplate(
      'Inquiry Received',
      `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Hello <strong>${params.name}</strong>,
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Thank you for reaching out to VectorAfriq! We have received your <strong>${params.serviceType}</strong> inquiry for <strong>${serviceLabel}</strong> services.
        </p>
        ${extraFieldsHtml}
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #166534; margin: 0; font-weight: 600;">What happens next?</p>
          <p style="color: #166534; margin: 8px 0 0;">
            Our team will review your inquiry and get back to you within 24 hours with a quote and professional match.
          </p>
        </div>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          If you have any urgent questions, please don't hesitate to contact us at
          <a href="mailto:inquiry@vectorafriqproperties.co.ke" style="color: #468AD1;">inquiry@vectorafriqproperties.co.ke</a>.
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0;">
          Best regards,<br/>
          <strong>VectorAfriq Team</strong>
        </p>
      `
    );

    await inquiryTransporter.sendMail({
      from: FROM_ADDRESS,
      to: params.to,
      subject: `Inquiry Received - ${params.serviceType} | VectorAfriq`,
      html,
    });

    return true;
  } catch (error) {
    console.error('[INQUIRY_CONFIRMATION_EMAIL]', error);
    return false;
  }
}

export async function sendInquiryReplyEmail(params: {
  to: string;
  name: string;
  serviceType: string;
  replyMessage: string;
  adminName?: string;
}) {
  try {
    const html = brandedTemplate(
      'Response to Your Inquiry',
      `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Hello <strong>${params.name}</strong>,
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          Thank you for your <strong>${params.serviceType}</strong> inquiry. Our team has reviewed your request and here is our response:
        </p>
        <div style="background: #f9fafb; border-left: 4px solid #468AD1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #1a1a2e; line-height: 1.7; margin: 0; white-space: pre-wrap;">${params.replyMessage.replace(/\n/g, '<br/>')}</p>
        </div>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">
          If you have any further questions, please reply to this email or reach out at
          <a href="mailto:inquiry@vectorafriqproperties.co.ke" style="color: #468AD1;">inquiry@vectorafriqproperties.co.ke</a>.
        </p>
        <p style="color: #374151; line-height: 1.6; margin: 0;">
          Best regards,<br/>
          <strong>${params.adminName || 'VectorAfriq Team'}</strong>
        </p>
      `
    );

    await inquiryTransporter.sendMail({
      from: FROM_ADDRESS,
      to: params.to,
      subject: `Re: Your ${params.serviceType} Inquiry | VectorAfriq`,
      html,
    });

    return true;
  } catch (error) {
    console.error('[INQUIRY_REPLY_EMAIL]', error);
    return false;
  }
}
