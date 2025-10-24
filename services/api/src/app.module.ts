import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PropertiesController } from './properties/properties.controller';
import { PropertiesService } from './properties/properties.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { KycController } from './kyc/kyc.controller';
import { KycService } from './kyc/kyc.service';
import { LandlordController } from './landlord/landlord.controller';
import { LandlordService } from './landlord/landlord.service';
import { TenantController } from './tenant/tenant.controller';
import { TenantService } from './tenant/tenant.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AppController, PropertiesController, AuthController, KycController, LandlordController, TenantController],
  providers: [AppService, PropertiesService, PrismaService, AuthService, KycService, LandlordService, TenantService],
})
export class AppModule {}
