import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // Log security events
  async logSecurityEvent(
    eventType: string,
    options: {
      userId?: string;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    } = {},
  ) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          eventType: eventType as any,
          userId: options.userId,
          email: options.email,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: options.metadata,
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Check if account is locked
  async isAccountLocked(email: string): Promise<{ locked: boolean; until?: Date }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { locked: false };

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { locked: true, until: user.lockedUntil };
    }

    // Clear expired lock
    if (user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lockedUntil: null, failedLoginAttempts: 0 },
      });
    }

    return { locked: false };
  }

  // Increment failed login attempts and lock if threshold exceeded
  async handleFailedLogin(email: string, ip?: string, userAgent?: string): Promise<{ locked: boolean; attemptsRemaining: number }> {
    const maxAttempts = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
    const lockDurationMinutes = Number(process.env.LOCK_DURATION_MINUTES || 15);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { locked: false, attemptsRemaining: maxAttempts };

    const newCount = user.failedLoginAttempts + 1;

    if (newCount >= maxAttempts) {
      const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newCount,
          lockedUntil,
        },
      });

      // Log security event
      await this.logSecurityEvent('ACCOUNT_LOCKED', {
        userId: user.id,
        email: user.email,
        ipAddress: ip,
        userAgent,
        metadata: { attempts: newCount, lockedUntil },
      });

      // Send email notification
      try {
        await this.email.sendAccountLocked(
          user.email,
          `Too many failed login attempts (${newCount})`,
          lockedUntil,
        );
      } catch (error) {
        console.error('Failed to send account locked email:', error);
      }

      return { locked: true, attemptsRemaining: 0 };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: newCount },
    });

    return { locked: false, attemptsRemaining: maxAttempts - newCount };
  }

  // Reset failed login attempts on successful login
  async handleSuccessfulLogin(userId: string, deviceInfo?: {name?: string; ip?: string; userAgent?: string}) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // Log success event
    await this.logSecurityEvent('LOGIN_SUCCESS', {
      userId: user.id,
      email: user.email,
      ipAddress: deviceInfo?.ip,
      userAgent: deviceInfo?.userAgent,
    });

    // Check if this is a new device
    if (deviceInfo?.ip) {
      const recentLogins = await this.prisma.loginAttempt.findMany({
        where: {
          email: user.email,
          succeeded: true,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const isNewDevice = !recentLogins.some(attempt => attempt.ip === deviceInfo.ip);

      if (isNewDevice && recentLogins.length > 0) {
        // New device detected!
        await this.logSecurityEvent('NEW_DEVICE_LOGIN', {
          userId: user.id,
          email: user.email,
          ipAddress: deviceInfo.ip,
          userAgent: deviceInfo.userAgent,
          metadata: { deviceName: deviceInfo.name },
        });

        // Send email notification
        try {
          await this.email.sendNewDeviceLogin(
            user.email,
            deviceInfo.name || 'Unknown Device',
            deviceInfo.ip,
            new Date(),
          );
        } catch (error) {
          console.error('Failed to send new device email:', error);
        }
      }
    }
  }

  // Get security events for a user
  async getUserSecurityEvents(userId: string, limit = 50) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
