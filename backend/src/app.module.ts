import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtModule } from '@nestjs/jwt';
import { OfficeModule } from './modules/office/office.module.js';
import configuration from './config/configuration.js';
import { PrismaModule } from './prisma.module.js';
import { PositionModule } from './modules/position/position.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { FireIncidentCategoriesModule } from './modules/fire-incident-categories/fire-incident-categories.module.js';
import { FireIncidentSubcategoriesModule } from './modules/fire-incident-subcategories/fire-incident-subcategories.module.js';
import { InvestigationModule } from './modules/investigation/investigation.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { StatisticsModule } from './modules/statistics/statistics.module.js';
import { AttachmentModule } from './modules/attachment/attachment.module.js';

// Built React app. Only served when it exists, so `start:dev` alongside the
// Vite dev server keeps working without a frontend build.
const frontendDist =
  process.env.FRONTEND_DIST ?? join(process.cwd(), '..', 'frontend', 'dist');
const serveFrontend = existsSync(join(frontendDist, 'index.html'))
  ? [
      ServeStaticModule.forRoot({
        rootPath: frontendDist,
        exclude: ['/api{/*path}'],
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Every sign/verify call passes its own secret and expiry (auth.service.ts, auth.guard.ts).
    JwtModule.register({ global: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OfficeModule,
    PositionModule,
    NotificationModule,
    FireIncidentCategoriesModule,
    FireIncidentSubcategoriesModule,
    InvestigationModule,
    AuditModule,
    StatisticsModule,
    AttachmentModule,
    ...serveFrontend,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
