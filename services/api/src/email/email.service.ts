import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailEnabled = String(process.env.EMAIL_DEV_MODE).toLowerCase() !== 'true';
    
    if (!emailEnabled) {
      console.log('📧 Email service in DEV mode - emails will be logged, not sent');
      return;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('⚠️  SMTP credentials not configured - email notifications disabled');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    console.log(`📧 Email service initialized: ${user}@${host}`);
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@shimahome.com';

    if (!this.transporter) {
      console.log(`[DEV] Email to ${to}:`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text || html}`);
      return { devMode: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text: text || '',
        html,
      });
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return { messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  // Security notification templates
  async sendNewDeviceLogin(to: string, deviceName: string, ipAddress?: string, timestamp?: Date) {
    const subject = '🔐 New Device Login - ShimaHome';
    const time = (timestamp || new Date()).toLocaleString();
    const ip = ipAddress || 'Unknown';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Device Login Detected</h2>
        <p>Hi there,</p>
        <p>We detected a login to your ShimaHome account from a new device:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceName}</p>
          <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
        </div>
        <p>If this was you, you can safely ignore this email.</p>
        <p>If you didn't log in from this device, please:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Review your active sessions and revoke any suspicious ones</li>
          <li>Enable two-factor authentication if you haven't already</li>
        </ol>
        <p>
          <a href="${process.env.WEB_ORIGIN}/profile/security/sessions" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Active Sessions
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ShimaHome Security Team<br>
          This is an automated security notification.
        </p>
      </div>
    `;

    const text = `New Device Login Detected\n\nDevice: ${deviceName}\nIP: ${ip}\nTime: ${time}\n\nIf this wasn't you, change your password immediately.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendPasswordResetRequest(to: string, resetToken: string) {
    const subject = '🔑 Password Reset Request - ShimaHome';
    const resetLink = `${process.env.WEB_ORIGIN}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your ShimaHome password.</p>
        <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
        <p>
          <a href="${resetLink}" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
        </p>
        <p style="color: #666;">Or copy this link:<br>
          <code style="background: #f5f5f5; padding: 5px; border-radius: 3px;">${resetLink}</code>
        </p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ShimaHome Security Team
        </p>
      </div>
    `;

    const text = `Password Reset Request\n\nClick this link to reset your password:\n${resetLink}\n\nLink expires in 15 minutes.\n\nIf you didn't request this, ignore this email.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendPasswordChanged(to: string) {
    const subject = '✅ Password Changed - ShimaHome';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed Successfully</h2>
        <p>Hi there,</p>
        <p>Your ShimaHome password was changed successfully.</p>
        <p>All active sessions on other devices have been logged out for your security.</p>
        <p>If you didn't make this change, please contact us immediately:</p>
        <p>
          <a href="${process.env.WEB_ORIGIN}/forgot-password" 
             style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password Now
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ShimaHome Security Team
        </p>
      </div>
    `;

    const text = `Your ShimaHome password was changed successfully.\n\nAll other sessions have been logged out.\n\nIf you didn't make this change, reset your password immediately.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendMfaEnabled(to: string) {
    const subject = '🔐 Two-Factor Authentication Enabled - ShimaHome';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Two-Factor Authentication Enabled</h2>
        <p>Hi there,</p>
        <p>Two-factor authentication (2FA) has been enabled on your ShimaHome account.</p>
        <p>Your account is now more secure! You'll need to enter a code from your authenticator app when logging in.</p>
        <p><strong>Important:</strong> Make sure you've saved your backup codes in a safe place.</p>
        <p>If you didn't enable 2FA, please secure your account immediately:</p>
        <ol>
          <li>Change your password</li>
          <li>Review active sessions and revoke suspicious ones</li>
          <li>Contact support if you need help</li>
        </ol>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ShimaHome Security Team
        </p>
      </div>
    `;

    const text = `Two-factor authentication has been enabled on your ShimaHome account.\n\nIf you didn't enable this, change your password immediately.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendMfaDisabled(to: string) {
    const subject = '⚠️  Two-Factor Authentication Disabled - ShimaHome';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Two-Factor Authentication Disabled</h2>
        <p>Hi there,</p>
        <p>Two-factor authentication (2FA) has been <strong>disabled</strong> on your ShimaHome account.</p>
        <p style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin: 20px 0;">
          <strong>⚠️  Security Notice:</strong> Your account is now less secure without 2FA.
        </p>
        <p>We recommend re-enabling 2FA to protect your account.</p>
        <p>If you didn't disable 2FA, please:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Re-enable two-factor authentication</li>
          <li>Review your active sessions</li>
        </ol>
        <p>
          <a href="${process.env.WEB_ORIGIN}/profile/security" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Security Settings
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ShimaHome Security Team
        </p>
      </div>
    `;

    const text = `Two-factor authentication has been disabled on your ShimaHome account.\n\nWe recommend re-enabling it for better security.\n\nIf you didn't do this, change your password immediately.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendAccountLocked(to: string, reason: string, unlockTime: Date) {
    const subject = '🔒 Account Temporarily Locked - ShimaHome';
    const unlock = unlockTime.toLocaleString();

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Temporarily Locked</h2>
        <p>Hi there,</p>
        <p>Your ShimaHome account has been temporarily locked due to:</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <strong>${reason}</strong>
        </div>
        <p><strong>Your account will automatically unlock at:</strong><br>${unlock}</p>
        <p>If this wasn't you, please:</p>
        <ol>
          <li>Wait for the automatic unlock</li>
          <li>Reset your password immediately after unlock</li>
          <li>Enable two-factor authentication</li>
          <li>Contact support if you need immediate assistance</li>
        </ol>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ShimaHome Security Team
        </p>
      </div>
    `;

    const text = `Your ShimaHome account has been temporarily locked.\n\nReason: ${reason}\n\nUnlocks at: ${unlock}\n\nIf you need help, contact support.`;

    return this.sendEmail(to, subject, html, text);
  }

  async sendVerificationCode(to: string, code: string, expiryMinutes = 15) {
    const subject = '🔐 Email Verification Code - ShimaHome';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Hi there,</p>
        <p>Your verification code for ShimaHome is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="margin: 0; letter-spacing: 8px; color: #3b82f6;">${code}</h1>
        </div>
        <p>This code will expire in ${expiryMinutes} minutes.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          ShimaHome Team
        </p>
      </div>
    `;

    const text = `Your ShimaHome verification code is: ${code}\n\nThis code expires in ${expiryMinutes} minutes.\n\nIf you didn't request this, ignore this email.`;

    return this.sendEmail(to, subject, html, text);
  }
}
