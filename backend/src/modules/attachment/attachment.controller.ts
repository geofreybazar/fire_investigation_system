import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { CASE_VIEWER_ROLES } from '../investigation/utils/case-scope.js';
import {
  AttachmentService,
  type UploadedFileData,
} from './attachment.service.js';
import { MAX_ATTACHMENT_BYTES } from './utils/file-type.js';
import {
  listAttachmentsQuerySchema,
  uploadAttachmentSchema,
  type ListAttachmentsQuery,
  type UploadAttachmentInput,
} from './schema/attachment.schema.js';

// One file per request, held in memory; larger files get 413.
const singleFile = FileInterceptor('file', {
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 },
});

@Roles(...CASE_VIEWER_ROLES)
@UseGuards(AuthGuard, RoleGuard)
@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get()
  async findPaginated(
    @Query({ schema: listAttachmentsQuerySchema }) query: ListAttachmentsQuery,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.attachmentService.findPaginated(query, user);
  }

  @Get('case/:caseId')
  async listForCase(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.attachmentService.listForCase(caseId, user);
  }

  @Post('case/:caseId')
  @UseInterceptors(singleFile)
  async uploadToCase(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @UploadedFile() file: UploadedFileData | undefined,
    @Body({ schema: uploadAttachmentSchema }) input: UploadAttachmentInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.attachmentService.uploadToCase(caseId, file, input, user);
  }

  @Get('investigation/:investigationId')
  async listForInvestigation(
    @Param('investigationId', new ParseUUIDPipe()) investigationId: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.attachmentService.listForInvestigation(investigationId, user);
  }

  @Post('investigation/:investigationId')
  @UseInterceptors(singleFile)
  async uploadToInvestigation(
    @Param('investigationId', new ParseUUIDPipe()) investigationId: string,
    @UploadedFile() file: UploadedFileData | undefined,
    @Body({ schema: uploadAttachmentSchema }) input: UploadAttachmentInput,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.attachmentService.uploadToInvestigation(
      investigationId,
      file,
      input,
      user,
    );
  }

  // Always a download, never shown inline, so a file can't run as a page.
  @Get(':id/download')
  async download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { attachment, stream } = await this.attachmentService.download(
      id,
      user,
    );
    const asciiName = attachment.originalName.replace(/[^\x20-\x7e]/g, '_');

    response.setHeader('Content-Type', attachment.mimeType);
    response.setHeader('Content-Length', String(attachment.sizeBytes));
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
    );
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store');

    return new StreamableFile(stream);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserJwtPayload,
  ) {
    return this.attachmentService.remove(id, user);
  }
}
