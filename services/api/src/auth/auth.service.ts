import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SecurityService } from '../security/security.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly security: SecurityService,
    private readonly email: EmailService,
  ) {}

  private async createRefreshToken(userId: string, deviceInfo?: { name?: string; type?: string; ip?: string; userAgent?: string }) {
    const tokenRaw = crypto.randomUUID() + ':' + Math.random().toString(36).slice(2);
    const tokenHash = await bcrypt.hash(tokenRaw, 10);
    const ttlDays = Number(process.env.REFRESH_TTL_DAYS || 30);
    const rt = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        deviceName: deviceInfo?.name,
        deviceType: deviceInfo?.type,
        ipAddress: deviceInfo?.ip,
        userAgent: deviceInfo?.userAgent,
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });
    return { raw: tokenRaw, record: rt };
  }

  private async rotateRefreshToken(oldToken: string) {
    const parts = oldToken;
    // Find matching refresh token by comparing hash
    const tokens = await this.prisma.refreshToken.findMany({ where: { revokedAt: null, expiresAt: { gt: new Date() } } });
    for (const t of tokens) {
      const match = await bcrypt.compare(parts, t.tokenHash);
      if (match) {
        await this.prisma.refreshToken.update({ where: { id: t.id }, data: { revokedAt: new Date() } });
        const { raw } = await this.createRefreshToken(t.userId);
        const user = await this.prisma.user.findUnique({ where: { id: t.userId } });
        if (!user) throw new UnauthorizedException();
        const access = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email });
        return { access, refresh: raw, user };
      }
    }
    throw new UnauthorizedException('Invalid refresh token');
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  // Session management
  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        ipAddress: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map(s => ({
      id: s.id,
      device: s.deviceName || 'Unknown Device',
      deviceType: s.deviceType || 'desktop',
      ip: s.ipAddress,
      lastUsed: s.lastUsedAt,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { ok: true, message: 'Session revoked' };
  }

  // Login history
  async getLoginHistory(userId: string, limit = 50) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const attempts = await this.prisma.loginAttempt.findMany({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return attempts.map(a => ({
      id: a.id,
      ip: a.ip,
      succeeded: a.succeeded,
      timestamp: a.createdAt,
    }));
  }

  async register(email: string, password: string, role: 'TENANT' | 'LANDLORD' | 'ADMIN' = 'TENANT') {
    // Basic password policy: min 8 chars, include letters and numbers
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new BadRequestException('Password must be at least 8 characters and include letters and numbers');
    }
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({ data: { email, passwordHash, role, emailVerified: false } });
    // Generate email verification code
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const ttlMin = Number(process.env.EMAIL_CODE_TTL_MIN || 15);
    await this.prisma.verificationCode.create({
      data: {
        userId: user.id,
        type: 'EMAIL',
        code,
        expiresAt: new Date(Date.now() + ttlMin * 60 * 1000),
      },
    });

    // Send email verification code
    try {
      await this.email.sendVerificationCode(user.email, code, ttlMin);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    // In dev mode, return the code for testing
    const hint = String(process.env.EMAIL_DEV_MODE).toLowerCase() === 'true' ? code : undefined;
    return { requiresEmailVerification: true, user: { id: user.id, email: user.email, role: user.role }, devCode: hint };
  }

  async login(email: string, password: string, ip?: string, deviceFingerprint?: string, userAgent?: string) {
    // Check if account is locked
    const lockStatus = await this.security.isAccountLocked(email);
    if (lockStatus.locked) {
      throw new UnauthorizedException(`Account locked until ${lockStatus.until?.toLocaleString()}`);
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Log failed attempt even if user doesn't exist (prevent enumeration but track)
      await this.prisma.loginAttempt.create({ 
        data: { email, ip, userAgent, succeeded: false, failReason: 'Invalid credentials' } 
      }).catch(() => {});
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    
    // Log the attempt
    await this.prisma.loginAttempt.create({ 
      data: { email, ip, userAgent, succeeded: ok, failReason: ok ? null : 'Invalid password' } 
    }).catch(() => {});

    if (!ok) {
      // Handle failed login
      const result = await this.security.handleFailedLogin(email, ip, userAgent);
      await this.security.logSecurityEvent('LOGIN_FAILED', {
        userId: user.id,
        email: user.email,
        ipAddress: ip,
        userAgent,
        metadata: { attemptsRemaining: result.attemptsRemaining },
      });

      if (result.locked) {
        throw new UnauthorizedException(`Too many failed attempts. Account locked for 15 minutes.`);
      }

      const attemptsMsg = result.attemptsRemaining === 1 
        ? '1 attempt remaining before account lockout' 
        : `${result.attemptsRemaining} attempts remaining`;
      throw new UnauthorizedException(`Invalid credentials. ${attemptsMsg}.`);
    }

    if (!user.emailVerified) throw new UnauthorizedException('Email not verified');
    
    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Check if device is trusted
      let deviceTrusted = false;
      if (deviceFingerprint) {
        const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
        const trusted = await this.prisma.trustedDevice.findFirst({
          where: {
            userId: user.id,
            deviceHash,
            expiresAt: { gt: new Date() },
          },
        });
        deviceTrusted = !!trusted;
      }

      if (!deviceTrusted) {
        // Create temporary token for MFA verification (short-lived)
        const mfaToken = await this.jwt.signAsync(
          { sub: user.id, type: 'mfa-pending', ip, userAgent },
          { expiresIn: '10m' }
        );
        return {
          requiresMfa: true,
          mfaToken,
          message: 'MFA verification required',
        };
      }
    }

    // No MFA or trusted device - issue tokens
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email }, { expiresIn: process.env.ACCESS_TTL || '15m' });
    const deviceInfo = this.parseDeviceInfo(userAgent, ip);
    const { raw: refresh } = await this.createRefreshToken(user.id, deviceInfo);
    
    // Handle successful login (reset attempts, log event, check new device)
    await this.security.handleSuccessfulLogin(user.id, deviceInfo);
    
    return { token, refresh, user: { id: user.id, email: user.email, role: user.role } };
  }

  private parseDeviceInfo(userAgent?: string, ip?: string): { name?: string; type?: string; ip?: string; userAgent?: string } {
    if (!userAgent) return { ip };
    
    let deviceType = 'desktop';
    let deviceName = 'Unknown Device';
    
    // Simple device detection
    if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
      deviceType = 'mobile';
      if (/iphone|ipad|ipod/i.test(userAgent)) deviceName = 'iOS Device';
      else if (/android/i.test(userAgent)) deviceName = 'Android Device';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
      deviceName = 'Tablet';
    }
    
    // Browser detection
    if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) deviceName += ' (Chrome)';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) deviceName += ' (Safari)';
    else if (/firefox/i.test(userAgent)) deviceName += ' (Firefox)';
    else if (/edge|edg/i.test(userAgent)) deviceName += ' (Edge)';
    
    return { name: deviceName, type: deviceType, ip, userAgent };
  }

  async verifyMfaAndLogin(mfaToken: string, code: string, trustDevice?: boolean, deviceFingerprint?: string) {
    // Verify MFA token
    const payload = await this.jwt.verifyAsync<{ sub: string; type: string; ip?: string; userAgent?: string }>(mfaToken).catch(() => null);
    if (!payload || payload.type !== 'mfa-pending') {
      throw new UnauthorizedException('Invalid MFA token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA not enabled');
    }

    // Verify TOTP code
    const speakeasy = require('speakeasy');
    const totpValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!totpValid) {
      // Try backup codes
      if (user.mfaBackupCodes) {
        const backupCodes: string[] = JSON.parse(user.mfaBackupCodes);
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');
        const index = backupCodes.indexOf(codeHash);

        if (index !== -1) {
          // Valid backup code - remove it
          backupCodes.splice(index, 1);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: JSON.stringify(backupCodes) },
          });
        } else {
          throw new UnauthorizedException('Invalid MFA code');
        }
      } else {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Trust device if requested
    if (trustDevice && deviceFingerprint) {
      const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await this.prisma.trustedDevice.upsert({
        where: { userId_deviceHash: { userId: user.id, deviceHash } },
        create: { userId: user.id, deviceHash, expiresAt },
        update: { lastUsedAt: new Date(), expiresAt },
      });
    }

    // Issue tokens with device info from MFA token
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email }, { expiresIn: process.env.ACCESS_TTL || '15m' });
    const deviceInfo = this.parseDeviceInfo(payload.userAgent, payload.ip);
    const { raw: refresh } = await this.createRefreshToken(user.id, deviceInfo);
    return { token, refresh, user: { id: user.id, email: user.email, role: user.role } };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { tenantProfile: true } });
    if (!user) throw new UnauthorizedException();
    const fullName = user.tenantProfile?.fullName || null;
    const displayName = user.tenantProfile?.displayName || null;
    return { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      fullName, 
      displayName,
      mfaEnabled: user.mfaEnabled,
    };
  }

  async refresh(oldRefreshToken: string) {
    return this.rotateRefreshToken(oldRefreshToken);
  }

  async resendEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Account not found');
    if (user.emailVerified) return { ok: true };
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const ttlMin = Number(process.env.EMAIL_CODE_TTL_MIN || 15);
    await this.prisma.verificationCode.create({
      data: { userId: user.id, type: 'EMAIL', code, expiresAt: new Date(Date.now() + ttlMin * 60 * 1000) },
    });

    // Send email verification code
    try {
      await this.email.sendVerificationCode(user.email, code, ttlMin);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    const hint = String(process.env.EMAIL_DEV_MODE).toLowerCase() === 'true' ? code : undefined;
    return { ok: true, devCode: hint };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Account not found');
    if (user.emailVerified) return { ok: true };
    const rec = await this.prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL',
        code,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!rec) throw new BadRequestException('Invalid or expired code');
    await this.prisma.$transaction([
      this.prisma.verificationCode.update({ where: { id: rec.id }, data: { consumedAt: new Date() } }),
      this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    ]);
    return { ok: true };
  }

  // Password reset flow
  async requestPasswordReset(email: string) {
    // Always return success to avoid email enumeration
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Still return OK but don't create token
      return { ok: true, message: 'If an account exists, a reset link will be sent' };
    }

    // Generate secure random token (URL-safe)
    const token = crypto.randomBytes(32).toString('base64url');
    const ttlMin = 15; // 15 minutes expiry
    
    // Invalidate any existing unused tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    // Create new token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + ttlMin * 60 * 1000),
      },
    });

    // Log security event
    await this.security.logSecurityEvent('PASSWORD_RESET_REQUESTED', {
      userId: user.id,
      email: user.email,
    });

    // Send email with reset link
    try {
      await this.email.sendPasswordResetRequest(user.email, token);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    // For dev mode, return token
    const devMode = String(process.env.EMAIL_DEV_MODE).toLowerCase() === 'true';
    const resetLink = devMode ? token : undefined;

    return { 
      ok: true, 
      message: 'If an account exists, a reset link will be sent',
      devResetToken: resetLink,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Validate password strength
    if (!newPassword || newPassword.length < 12) {
      throw new BadRequestException('Password must be at least 12 characters');
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw new BadRequestException('Password must include at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      throw new BadRequestException('Password must include at least one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new BadRequestException('Password must include at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      throw new BadRequestException('Password must include at least one special character');
    }

    // Find valid token
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if new password is same as old (optional security measure)
    const sameAsOld = await bcrypt.compare(newPassword, resetToken.user.passwordHash);
    if (sameAsOld) {
      throw new BadRequestException('New password cannot be the same as your current password');
    }

    // Update password and mark token as consumed
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { consumedAt: new Date() },
      }),
      // Revoke all refresh tokens for security
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    // Log security event
    await this.security.logSecurityEvent('PASSWORD_RESET_COMPLETED', {
      userId: resetToken.userId,
      email: resetToken.user.email,
    });

    // Send security notification email
    try {
      await this.email.sendPasswordChanged(resetToken.user.email);
    } catch (error) {
      console.error('Failed to send password changed email:', error);
    }

    return { ok: true, message: 'Password reset successful. Please log in with your new password.' };
  }
}
