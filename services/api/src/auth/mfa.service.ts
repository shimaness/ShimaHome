import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  // Generate TOTP secret and QR code for enrollment
  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ShimaHome (${user.email})`,
      issuer: 'ShimaHome',
      length: 32,
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret temporarily (not enabled yet, needs verification)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      manual: secret.otpauth_url,
    };
  }

  // Verify TOTP code and enable MFA
  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Hash backup codes before storing
    const hashedCodes = await Promise.all(
      backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'))
    );

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaBackupCodes: JSON.stringify(hashedCodes),
      },
    });

    return {
      ok: true,
      backupCodes, // Return raw codes ONCE for user to save
      message: 'MFA enabled successfully. Save these backup codes in a safe place.',
    };
  }

  // Verify TOTP code during login
  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException();
    }

    // Try TOTP verification first
    const totpValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (totpValid) return true;

    // If TOTP fails, try backup codes
    if (user.mfaBackupCodes) {
      const backupCodes: string[] = JSON.parse(user.mfaBackupCodes);
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const index = backupCodes.indexOf(codeHash);

      if (index !== -1) {
        // Valid backup code - remove it (single use)
        backupCodes.splice(index, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: JSON.stringify(backupCodes) },
        });
        return true;
      }
    }

    return false;
  }

  // Disable MFA (requires password confirmation in controller)
  async disableMfa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      },
    });

    // Remove all trusted devices
    await this.prisma.trustedDevice.deleteMany({ where: { userId } });

    return { ok: true, message: 'MFA disabled successfully' };
  }

  // Regenerate backup codes (requires MFA verification)
  async regenerateBackupCodes(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    const hashedCodes = await Promise.all(
      backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex'))
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: JSON.stringify(hashedCodes) },
    });

    return {
      ok: true,
      backupCodes,
      message: 'New backup codes generated. Previous codes are now invalid.',
    };
  }

  // Trust device management
  async trustDevice(userId: string, deviceFingerprint: string, deviceName?: string) {
    const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.trustedDevice.upsert({
      where: { userId_deviceHash: { userId, deviceHash } },
      create: { userId, deviceHash, deviceName, expiresAt },
      update: { lastUsedAt: new Date(), expiresAt },
    });

    return { ok: true, expiresAt };
  }

  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    const deviceHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
    const trusted = await this.prisma.trustedDevice.findUnique({
      where: {
        userId_deviceHash: { userId, deviceHash },
        expiresAt: { gt: new Date() },
      },
    });
    return !!trusted;
  }

  async getTrustedDevices(userId: string) {
    const devices = await this.prisma.trustedDevice.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });

    return devices.map(d => ({
      id: d.id,
      name: d.deviceName || 'Unknown Device',
      lastUsed: d.lastUsedAt,
      expiresAt: d.expiresAt,
    }));
  }

  async removeTrustedDevice(userId: string, deviceId: string) {
    await this.prisma.trustedDevice.delete({
      where: { id: deviceId, userId }, // Ensure user owns this device
    });
    return { ok: true };
  }
}
