import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module.js';
import { InvestigationController } from './investigation.controller.js';
import { InvestigationService } from './investigation.service.js';
import { InvestigationRepository } from './investigation.repository.js';
import { CaseController } from './case.controller.js';
import { CaseService } from './case.service.js';
import { CaseRepository } from './case.repository.js';

@Module({
  imports: [NotificationModule],
  controllers: [CaseController, InvestigationController],
  providers: [
    CaseService,
    CaseRepository,
    InvestigationService,
    InvestigationRepository,
  ],
})
export class InvestigationModule {}
