import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReportDecision, ROLE } from '../../generated/prisma/enums.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { InvestigationRepository } from './investigation.repository.js';
import { NotificationDispatcher } from '../notification/notification.dispatcher.js';
import { notificationMessages } from '../notification/notification.messages.js';
import {
  type ReviewReportInput,
  type UpdateInvestigationInput,
} from './schema/investigation.schema.js';
import {
  assertInvestigationConcluded,
  CHIEF_INVESTIGATOR_ROLES,
  REPORT_EDITABLE_STATUSES,
} from './utils/investigation-rules.js';
import {
  assertHandlingChief,
  isCaseVisible,
  type ViewerScope,
} from './utils/case-scope.js';

const PAGE_SIZE = 10;

type AccessInvestigation = NonNullable<
  Awaited<ReturnType<InvestigationRepository['findForAccess']>>
>;

@Injectable()
export class InvestigationService {
  private readonly logger = new Logger(InvestigationService.name);

  constructor(
    private readonly investigationRepository: InvestigationRepository,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  // ----- The investigation itself -----

  async findOne(id: string, user: CurrentUserJwtPayload) {
    await this.findVisibleInvestigation(id, user);

    return this.investigationRepository.findDetail(id);
  }

  async updateDraft(
    id: string,
    input: UpdateInvestigationInput,
    user: CurrentUserJwtPayload,
  ) {
    const investigation = await this.findVisibleInvestigation(id, user);
    this.assertAssignedInvestigator(investigation, user);
    this.assertEditable(investigation);

    const { report, ...fields } = input;

    const saved = await this.investigationRepository.updateDraft(id, {
      investigation: fields,
      report,
    });

    if (!saved) {
      throw new ConflictException('The investigation can no longer be edited.');
    }

    return { message: 'Investigation saved.' };
  }

  async submit(id: string, user: CurrentUserJwtPayload) {
    const investigation = await this.findVisibleInvestigation(id, user);
    this.assertAssignedInvestigator(investigation, user);
    this.assertEditable(investigation);

    if (!investigation.report) {
      throw new BadRequestException('Write the report before submitting it.');
    }

    assertInvestigationConcluded(investigation);

    if (!(await this.investigationRepository.submitReport(id))) {
      throw new ConflictException('The report can no longer be submitted.');
    }

    await this.notificationDispatcher.notify({
      ...notificationMessages.reportSubmitted(
        id,
        investigation.investigationNo,
      ),
      actorId: user.sub,
      recipients: {
        officeId: investigation.conductingOfficeId,
        roles: CHIEF_INVESTIGATOR_ROLES,
      },
    });

    return { message: 'Report submitted.' };
  }

  async review(
    id: string,
    input: ReviewReportInput,
    user: CurrentUserJwtPayload,
  ) {
    const investigation = await this.findVisibleInvestigation(id, user);
    assertHandlingChief(user, investigation.conductingOfficeId);

    if (input.decision === ReportDecision.APPROVED) {
      assertInvestigationConcluded(investigation);
    }

    const reviewed = await this.investigationRepository.review(
      id,
      input.decision,
      user.sub,
      input.remarks,
    );

    if (!reviewed) {
      throw new ConflictException(
        `The report cannot be marked ${input.decision} in its current state.`,
      );
    }

    this.logger.log(`Investigation report ${input.decision}: ${id}`);

    // Moving the report to UNDER_REVIEW tells the investigator nothing new.
    const decided =
      input.decision === ReportDecision.APPROVED
        ? notificationMessages.reportApproved(id, investigation.investigationNo)
        : input.decision === ReportDecision.REJECTED
          ? notificationMessages.reportRejected(
              id,
              investigation.investigationNo,
              input.remarks,
            )
          : null;

    if (decided) {
      await this.notificationDispatcher.notify({
        ...decided,
        actorId: user.sub,
        recipients: { userIds: [investigation.assignedInvestigatorId] },
      });
    }

    return {
      message: `Report ${input.decision.toLowerCase().replace('_', ' ')}.`,
    };
  }

  // ----- Work lists -----

  // Cases whose investigation decisions sit with the chief's office.
  async findQueue(page: number, user: CurrentUserJwtPayload) {
    if (
      user.role !== ROLE.SUPER_ADMIN &&
      !CHIEF_INVESTIGATOR_ROLES.includes(user.role)
    ) {
      throw new ForbiddenException(
        'Only chief investigators have a case queue.',
      );
    }

    const { cases, total } = await this.investigationRepository.findQueue(
      user.officeId,
      (page - 1) * PAGE_SIZE,
      PAGE_SIZE,
    );

    return this.page(cases, total, page);
  }

  async findAssigned(page: number, user: CurrentUserJwtPayload) {
    const { investigations, total } =
      await this.investigationRepository.findAssigned(
        user.sub,
        (page - 1) * PAGE_SIZE,
        PAGE_SIZE,
      );

    return this.page(investigations, total, page);
  }

  // ----- Shared checks -----

  private async viewerScope(user: CurrentUserJwtPayload): Promise<ViewerScope> {
    const office = await this.investigationRepository.findOfficeType(
      user.officeId,
    );

    if (!office) {
      throw new ForbiddenException('Your office was not found.');
    }

    return { user, officeType: office.type };
  }

  // Investigations follow their case's visibility; anything outside the
  // user's scope is a 404.
  private async findVisibleInvestigation(
    id: string,
    user: CurrentUserJwtPayload,
  ): Promise<AccessInvestigation> {
    const scope = await this.viewerScope(user);
    const investigation = await this.investigationRepository.findForAccess(id);

    if (!investigation || !isCaseVisible(investigation.case, scope)) {
      throw new NotFoundException('Investigation not found.');
    }

    return investigation;
  }

  private assertAssignedInvestigator(
    investigation: AccessInvestigation,
    user: CurrentUserJwtPayload,
  ) {
    if (
      user.role !== ROLE.SUPER_ADMIN &&
      investigation.assignedInvestigatorId !== user.sub
    ) {
      throw new ForbiddenException(
        'Only the assigned investigator can change this investigation.',
      );
    }
  }

  private assertEditable(investigation: AccessInvestigation) {
    if (
      investigation.completedAt !== null ||
      (investigation.report &&
        !REPORT_EDITABLE_STATUSES.includes(investigation.report.status))
    ) {
      throw new ConflictException(
        'The investigation is locked while its report is under review or approved.',
      );
    }
  }

  private page<T>(data: T[], total: number, page: number) {
    return {
      data,
      pagination: {
        page,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    };
  }
}
