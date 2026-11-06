import { Module } from '@nestjs/common';
import { AttachmentController } from './attachment.controller.js';
import { AttachmentService } from './attachment.service.js';
import { AttachmentRepository } from './attachment.repository.js';
import { AttachmentStorage } from './attachment.storage.js';

@Module({
  controllers: [AttachmentController],
  providers: [AttachmentService, AttachmentRepository, AttachmentStorage],
})
export class AttachmentModule {}
