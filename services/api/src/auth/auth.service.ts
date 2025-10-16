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
    const user = await this.prisma.user.create({ data: { email, passwordHash, role } });
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email }, { expiresIn: process.env.ACCESS_TTL || '15m' });
    const { raw: refresh } = await this.createRefreshToken(user.id);
    return { token, refresh, user: { id: user.id, email: user.email, role: user.role } };
  }

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    await this.prisma.loginAttempt.create({ data: { email, ip, succeeded: ok } }).catch(() => {});
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email }, { expiresIn: process.env.ACCESS_TTL || '15m' });
    const { raw: refresh } = await this.createRefreshToken(user.id);
    return { token, refresh, user: { id: user.id, email: user.email, role: user.role } };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role };
  }

  async refresh(oldRefreshToken: string) {
    return this.rotateRefreshToken(oldRefreshToken);
  }
}
