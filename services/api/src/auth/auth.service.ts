import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  private async createRefreshToken(userId: string) {
    const tokenRaw = crypto.randomUUID() + ':' + Math.random().toString(36).slice(2);
    const tokenHash = await bcrypt.hash(tokenRaw, 10);
    const ttlDays = Number(process.env.REFRESH_TTL_DAYS || 30);
    const rt = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
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
    // TODO: Integrate email provider; in dev mode expose the code for testing
    const hint = String(process.env.EMAIL_DEV_MODE).toLowerCase() === 'true' ? code : undefined;
    return { requiresEmailVerification: true, user: { id: user.id, email: user.email, role: user.role }, devCode: hint };
  }

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    await this.prisma.loginAttempt.create({ data: { email, ip, succeeded: ok } }).catch(() => {});
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (!user.emailVerified) throw new UnauthorizedException('Email not verified');
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email }, { expiresIn: process.env.ACCESS_TTL || '15m' });
    const { raw: refresh } = await this.createRefreshToken(user.id);
    return { token, refresh, user: { id: user.id, email: user.email, role: user.role } };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { tenantProfile: true } });
    if (!user) throw new UnauthorizedException();
    const fullName = user.tenantProfile?.fullName || null;
    const displayName = user.tenantProfile?.displayName || null;
    return { id: user.id, email: user.email, role: user.role, fullName, displayName };
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
    const hint = process.env.NODE_ENV === 'production' ? undefined : code;
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

    // TODO: Send email with reset link
    // For now, return token in dev mode
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
        data: { passwordHash },
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

    // TODO: Send security notification email

    return { ok: true, message: 'Password reset successful. Please log in with your new password.' };
  }
}
