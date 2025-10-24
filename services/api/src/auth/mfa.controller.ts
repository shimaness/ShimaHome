import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfa: MfaService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private async getUserFromAuth(authHeader?: string): Promise<{ id: string } | null> {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length);
    const payload = await this.jwt.verifyAsync<{ sub: string }>(token).catch(() => null);
    return payload?.sub ? { id: payload.sub } : null;
  }

  @Post('setup')
  async setupMfa(@Headers('authorization') authHeader?: string) {
    const user = await this.getUserFromAuth(authHeader);
    if (!user) return { error: 'Unauthorized' };
    return this.mfa.setupMfa(user.id);
  }

  @Post('enable')
  async enableMfa(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { code: string },
  ) {
    const user = await this.getUserFromAuth(authHeader);
    if (!user) return { error: 'Unauthorized' };
    if (!body?.code) return { error: 'Verification code required' };
    return this.mfa.enableMfa(user.id, body.code);
  }

  @Post('disable')
  async disableMfa(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { password: string },
  ) {
    const user = await this.getUserFromAuth(authHeader);
    if (!user) return { error: 'Unauthorized' };
    if (!body?.password) return { error: 'Password required' };

    // Verify password before disabling
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return { error: 'Unauthorized' };
    
    const valid = await bcrypt.compare(body.password, dbUser.passwordHash);
    if (!valid) return { error: 'Invalid password' };

    return this.mfa.disableMfa(user.id);
  }

  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { code: string },
  ) {
    const user = await this.getUserFromAuth(authHeader);
    if (!user) return { error: 'Unauthorized' };
    if (!body?.code) return { error: 'MFA code required' };

    // Verify MFA code before regenerating
    const valid = await this.mfa.verifyMfaCode(user.id, body.code);
    if (!valid) return { error: 'Invalid MFA code' };

    return this.mfa.regenerateBackupCodes(user.id);
  }

  @Get('trusted-devices')
  async getTrustedDevices(@Headers('authorization') authHeader: string | undefined) {
    const user = await this.getUserFromAuth(authHeader);
    if (!user) return { error: 'Unauthorized' };
    return this.mfa.getTrustedDevices(user.id);
  }

  @Delete('trusted-devices/:deviceId')
  async removeTrustedDevice(
    @Headers('authorization') authHeader: string | undefined,
    @Param('deviceId') deviceId: string,
  ) {
    const user = await this.getUserFromAuth(authHeader);
    if (!user) return { error: 'Unauthorized' };
    return this.mfa.removeTrustedDevice(user.id, deviceId);
  }
}
