import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

export const emailService = {
  async sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'VectorAfriq - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #468AD1;">Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background: #468AD1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Password reset email error:', error);
      return false;
    }
  },

  async sendOtpEmail(email: string, otp: string) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'VectorAfriq - Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #468AD1;">VectorAfriq Login Verification</h2>
            <p>Your OTP code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('OTP email error:', error);
      return false;
    }
  }
};

export async function sendOtpEmail(email: string, otp: string) {
  return emailService.sendOtpEmail(email, otp);
}