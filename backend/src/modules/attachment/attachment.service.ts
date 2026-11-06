import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import {
  caseScopeWhere,
  isCaseVisible,
  isChief,
  isHandlingChief,
  type CaseVisibilityFields,
  type ViewerScope,
} from '../investigation/utils/case-scope.js';
import { AttachmentRepository } from './attachment.repository.js';
import { AttachmentStorage } from './attachment.storage.js';
import { detectFileType, safeFileName } from './utils/file-type.js';
import {
  type ListAttachmentsQuery,
  type UploadAttachmentInput,
} from './schema/attachment.schema.js';

const PAGE_SIZE = 20;

// The parts of a multer upload the service uses.
export interface UploadedFileData {
  originalname: string;
  size: number;
  buffer: Buffer;
}

// Attachments (REQUIREMENTS.md Q-22). Anyone who can see the case can list
// and download them; deleted cases hide them.
@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly storage: AttachmentStorage,
  ) {}

  // The handling office's chief investigator, or the chief who created the
  // case, attaches case documents.
  async uploadToCase(
    caseId: string,
    file: UploadedFileData | undefined,
    input: UploadAttachmentInput,
    user: CurrentUserJwtPayload,
  ) {
    const found = await this.attachmentRepository.findCase(caseId);
    await this.assertVisible(found, user, 'Investigation case not found.');

    if (
      !isHandlingChief(user, found!.handlingOfficeId) &&
      !(found!.createdById === user.sub && isChief(user))
    ) {
      throw new ForbiddenException(
        "Only the case's creator or the handling office's chief investigator can attach files to a case.",
      );
    }

    return this.store(file, input, user, { caseId });
  }

  // The assigned investigator adds evidence while the investigation is open.
  async uploadToInvestigation(
    investigationId: string,
    file: UploadedFileData | undefined,
    input: UploadAttachmentInput,
    user: CurrentUserJwtPayload,
  ) {
    const investigation =
      await this.attachmentRepository.findInvestigation(investigationId);
    await this.assertVisible(
      investigation?.case,
      user,
      'Investigation not found.',
    );

    if (investigation!.assignedInvestigatorId !== user.sub) {
      throw new ForbiddenException(
        'Only the assigned investigator can add evidence.',
      );
    }

    if (investigation!.completedAt) {
      throw new ConflictException(
        'The investigation is approved and locked; evidence can no longer be added.',
      );
    }

    return this.store(file, input, user, {
      caseId: investigation!.caseId,
      investigationId,
    });
  }

  async listForCase(caseId: string, user: CurrentUserJwtPayload) {
    const found = await this.attachmentRepository.findCase(caseId);
    await this.assertVisible(found, user, 'Investigation case not found.');

    return this.attachmentRepository.listForCase(caseId);
  }

  async listForInvestigation(
    investigationId: string,
    user: CurrentUserJwtPayload,
  ) {
    const investigation =
      await this.attachmentRepository.findInvestigation(investigationId);
    await this.assertVisible(
      investigation?.case,
      user,
      'Investigation not found.',
    );

    return this.attachmentRepository.listForInvestigation(investigationId);
  }

  // Every attachment on cases the user can see (the Evidence page).
  async findPaginated(
    query: ListAttachmentsQuery,
    user: CurrentUserJwtPayload,
  ) {
    const where: Prisma.AttachmentWhereInput = {
      removedAt: null,
      case: caseScopeWhere(await this.viewerScope(user)),
      ...(query.kind === 'case' && { investigationId: null }),
      ...(query.kind === 'investigation' && {
        investigationId: { not: null },
      }),
    };

    const skip = (query.page - 1) * PAGE_SIZE;
    const { attachments, total } =
      await this.attachmentRepository.findPaginated(where, skip, PAGE_SIZE);

    return {
      data: attachments,
      pagination: {
        page: query.page,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    };
  }

  // Every download is audited (Q-22).
  async download(id: string, user: CurrentUserJwtPayload) {
    const attachment = await this.findVisibleAttachment(id, user);

    await this.attachmentRepository.recordDownload(
      attachment,
      {
        officeId: attachment.case.station.id,
        regionId: attachment.case.station.regionId,
      },
      user.sub,
    );

    return {
      attachment,
      stream: this.storage.open(attachment.storageKey),
    };
  }

  // Only the uploader removes, and evidence only while the investigation is
  // open. Removal is soft: the file and its row are kept.
  async remove(id: string, user: CurrentUserJwtPayload) {
    const attachment = await this.findVisibleAttachment(id, user);

    if (attachment.uploadedBy.id !== user.sub) {
      throw new ForbiddenException(
        'Only the person who uploaded a file can remove it.',
      );
    }

    if (attachment.investigation?.completedAt) {
      throw new ConflictException(
        'The investigation is approved and locked; its evidence can no longer be removed.',
      );
    }

    if (!(await this.attachmentRepository.softRemove(id, user.sub))) {
      throw new NotFoundException('Attachment not found.');
    }

    return { message: 'Attachment removed.' };
  }

  private async store(
    file: UploadedFileData | undefined,
    input: UploadAttachmentInput,
    user: CurrentUserJwtPayload,
    target: { caseId: string; investigationId?: string },
  ) {
    if (!file || file.size === 0) {
      throw new BadRequestException('Choose a file to upload.');
    }

    const detected = detectFileType(file.buffer);

    if (!detected) {
      throw new UnsupportedMediaTypeException(
        'Only JPEG, PNG, WebP and PDF files are allowed.',
      );
    }

    const storageKey = await this.storage.save(file.buffer);

    try {
      const attachment = await this.attachmentRepository.create({
        ...target,
        uploadedById: user.sub,
        originalName: safeFileName(file.originalname, detected),
        mimeType: detected.mimeType,
        sizeBytes: file.size,
        storageKey,
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
        description: input.description || null,
      });

      this.logger.log(`Attachment stored: ${attachment.id}`);

      return attachment;
    } catch (error) {
      // No row, no file: don't leave an orphan on disk.
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  // Missing, removed and out-of-scope attachments all look the same (404).
  private async findVisibleAttachment(id: string, user: CurrentUserJwtPayload) {
    const attachment = await this.attachmentRepository.findById(id);

    if (!attachment || attachment.removedAt) {
      throw new NotFoundException('Attachment not found.');
    }

    await this.assertVisible(attachment.case, user, 'Attachment not found.');

    return attachment;
  }

  private async assertVisible(
    found: CaseVisibilityFields | null | undefined,
    user: CurrentUserJwtPayload,
    notFound: string,
  ) {
    const scope = await this.viewerScope(user);

    if (!found || !isCaseVisible(found, scope)) {
      throw new NotFoundException(notFound);
    }
  }

  private async viewerScope(user: CurrentUserJwtPayload): Promise<ViewerScope> {
    const office = await this.attachmentRepository.findOfficeType(
      user.officeId,
    );

    if (!office) {
      throw new ForbiddenException('Your office was not found.');
    }

    return { user, officeType: office.type };
  }
}
