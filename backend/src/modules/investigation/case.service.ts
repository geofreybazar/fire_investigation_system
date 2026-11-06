import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { ROLE } from '../../generated/prisma/enums.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { CaseRepository } from './case.repository.js';
import { NotificationDispatcher } from '../notification/notification.dispatcher.js';
import { notificationMessages } from '../notification/notification.messages.js';
import {
  type CreateCaseInput,
  type DeleteCaseInput,
  type ListCasesQuery,
  type UpdateCaseInput,
} from './schema/case.schema.js';
import {
  type ReferCaseInput,
  type StartInvestigationInput,
} from './schema/investigation.schema.js';
import {
  CHIEF_INVESTIGATOR_ROLES,
  INVESTIGATOR_ROLES,
  referralDirection,
  referralTargets,
  stationChain,
} from './utils/investigation-rules.js';
import {
  assertHandlingChief,
  caseScopeWhere,
  CITY_MUNICIPAL_STATIONS,
  isChief,
  isHandlingChief,
  isCaseVisible,
  isStationInScope,
  stationScopeWhere,
  type ViewerScope,
} from './utils/case-scope.js';

const PAGE_SIZE = 10;

type AccessCase = NonNullable<
  Awaited<ReturnType<CaseRepository['findForAccess']>>
>;

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(
    private readonly caseRepository: CaseRepository,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  // ----- Create, read, update -----

  // A chief investigator opens a case for a station within their scope and
  // assigns its first investigation to an investigator of their own office.
  async create(input: CreateCaseInput, user: CurrentUserJwtPayload) {
    if (!isChief(user)) {
      throw new ForbiddenException(
        'Only chief investigators can create investigation cases.',
      );
    }

    const scope = await this.viewerScope(user);
    const station = await this.caseRepository.findStation(input.stationId);

    if (
      !station ||
      !station.isActive ||
      !CITY_MUNICIPAL_STATIONS.includes(station.type) ||
      !isStationInScope(station, scope)
    ) {
      throw new BadRequestException(
        'Choose an active city or municipal station within your office.',
      );
    }

    if (!station.parent || !station.region?.regionCode) {
      throw new BadRequestException(
        'The station is missing its district/province or region (with a region code).',
      );
    }

    await this.assertValidReferences(input);
    await this.assertAssignable(input.investigatorId, user.officeId);

    const { location, impact, investigatorId, stationId: _, ...fields } = input;

    const created = await this.caseRepository.create({
      ...fields,
      station: { id: station.id, regionCode: station.region.regionCode },
      createdByOfficeId: user.officeId,
      createdById: user.sub,
      location: {
        placeOfOccurence: location.placeOfOccurence,
        barangay: location.barangay,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        // Derived from the station's office hierarchy, never from the client.
        city_municipality: station.name,
        province_district: station.parent.name,
        region: station.region.name,
      },
      impact,
      assignedInvestigatorId: investigatorId,
    });

    const [first] = created.investigations;
    this.logger.log(`Investigation case created: ${created.caseNo}`);

    await this.notificationDispatcher.notify({
      ...notificationMessages.investigatorAssigned(
        first.id,
        first.investigationNo,
      ),
      actorId: user.sub,
      recipients: { userIds: [investigatorId] },
    });

    return { id: created.id, caseNo: created.caseNo, investigation: first };
  }

  async findAll(query: ListCasesQuery, user: CurrentUserJwtPayload) {
    const scope = await this.viewerScope(user);
    const filters: Prisma.InvestigationCaseWhereInput[] = [];

    if (query.state === 'OPEN') {
      filters.push({ investigations: { some: { completedAt: null } } });
    } else if (query.state === 'CLOSED') {
      filters.push({ investigations: { none: { completedAt: null } } });
    }

    if (query.categoryId) filters.push({ categoryId: query.categoryId });

    if (query.search) {
      const contains = { contains: query.search, mode: 'insensitive' } as const;
      filters.push({
        OR: [
          { caseNo: contains },
          { location: { placeOfOccurence: contains } },
          { location: { barangay: contains } },
          { location: { city_municipality: contains } },
        ],
      });
    }

    if (query.from || query.to) {
      const range = {
        ...(query.from && { gte: query.from }),
        ...(query.to && { lte: query.to }),
      };
      filters.push({
        OR: [
          { dateTimeFireIncident: range },
          { dateTimeFireIncident: null, createdAt: range },
        ],
      });
    }

    const where: Prisma.InvestigationCaseWhereInput = {
      AND: [caseScopeWhere(scope), ...filters],
    };

    const { cases, total } = await this.caseRepository.findPaginated(
      where,
      (query.page - 1) * PAGE_SIZE,
      PAGE_SIZE,
    );

    return this.page(cases, total, query.page);
  }

  // The case with its referrals and investigations, and what the current
  // user can do next.
  async findOne(id: string, user: CurrentUserJwtPayload) {
    const found = await this.findVisibleCase(id, user);
    const detail = await this.caseRepository.findDetail(id);

    if (!detail) {
      throw new NotFoundException('Investigation case not found.');
    }

    const chain = stationChain(found.station);
    const hasOpen = detail.investigations.some(
      (investigation) => investigation.completedAt === null,
    );
    const hasCompleted = detail.investigations.some(
      (investigation) => investigation.completedAt !== null,
    );
    const canDecide = isHandlingChief(user, found.handlingOfficeId) && !hasOpen;

    return {
      ...detail,
      canDecide,
      canEdit: this.mayEdit(found, user) && !hasCompleted,
      referralTargets: canDecide
        ? referralTargets(chain, found.handlingOfficeId)
        : [],
    };
  }

  async update(
    id: string,
    input: UpdateCaseInput,
    user: CurrentUserJwtPayload,
  ) {
    const found = await this.findVisibleCase(id, user);

    if (!this.mayEdit(found, user)) {
      throw new ForbiddenException(
        "Only the case's creator or the handling office's chief investigator can edit it.",
      );
    }

    await this.assertValidReferences(input, found.categoryId);

    const {
      location,
      impact,
      categoryId,
      subcategoryId,
      establishmentId,
      ...fields
    } = input;

    const data: Prisma.InvestigationCaseUpdateInput = {
      ...fields,
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      // A new category without a subcategory clears the old subcategory.
      ...((subcategoryId !== undefined || categoryId) && {
        subcategory: subcategoryId
          ? { connect: { id: subcategoryId } }
          : { disconnect: true },
      }),
      ...(establishmentId !== undefined && {
        establishment: establishmentId
          ? { connect: { id: establishmentId } }
          : { disconnect: true },
      }),
      ...(location && { location: { update: location } }),
      ...(impact && {
        impact: { upsert: { create: impact, update: impact } },
      }),
    };

    if (!(await this.caseRepository.update(id, data))) {
      throw new ConflictException(
        'The case can no longer be edited: it is deleted or an investigation was approved.',
      );
    }

    return { message: 'Investigation case updated.' };
  }

  // ----- Investigation workflow on the case -----

  async findCandidates(id: string, user: CurrentUserJwtPayload) {
    const found = await this.findVisibleCase(id, user);
    assertHandlingChief(user, found.handlingOfficeId);

    return this.caseRepository.findInvestigators(found.handlingOfficeId);
  }

  // Investigators a chief can assign when creating a case at their office.
  async findOwnInvestigators(user: CurrentUserJwtPayload) {
    if (!isChief(user)) {
      throw new ForbiddenException(
        'Only chief investigators can assign investigators.',
      );
    }

    return this.caseRepository.findInvestigators(user.officeId);
  }

  // Stations within a chief's office, for the location of a new case.
  async findStations(user: CurrentUserJwtPayload) {
    if (!isChief(user)) {
      throw new ForbiddenException(
        'Only chief investigators can create investigation cases.',
      );
    }

    const scope = await this.viewerScope(user);
    return this.caseRepository.findStations(stationScopeWhere(scope));
  }

  async refer(id: string, input: ReferCaseInput, user: CurrentUserJwtPayload) {
    const found = await this.findVisibleCase(id, user);
    const fromOfficeId = found.handlingOfficeId;
    assertHandlingChief(user, fromOfficeId);

    const direction = referralDirection(
      stationChain(found.station),
      fromOfficeId,
      input.toOfficeId,
    );

    const referred = await this.caseRepository.refer(id, {
      fromOfficeId,
      toOfficeId: input.toOfficeId,
      direction,
      referredById: user.sub,
      remarks: input.remarks,
    });

    if (!referred) {
      throw new ConflictException(
        'The case cannot be referred while an investigation is open, or it has already moved.',
      );
    }

    this.logger.log(
      `Investigation case referred ${direction}: ${found.caseNo}`,
    );

    await this.notificationDispatcher.notify({
      ...notificationMessages.caseReferred(id, found.caseNo),
      actorId: user.sub,
      recipients: {
        officeId: input.toOfficeId,
        roles: CHIEF_INVESTIGATOR_ROLES,
      },
    });

    return { message: 'Case referred.', direction };
  }

  async start(
    id: string,
    input: StartInvestigationInput,
    user: CurrentUserJwtPayload,
  ) {
    const found = await this.findVisibleCase(id, user);
    const handlingOfficeId = found.handlingOfficeId;
    assertHandlingChief(user, handlingOfficeId);
    await this.assertAssignable(input.investigatorId, handlingOfficeId);

    const investigation = await this.caseRepository.start(id, {
      conductingOfficeId: handlingOfficeId,
      assignedInvestigatorId: input.investigatorId,
      assignedById: user.sub,
    });

    if (!investigation) {
      throw new ConflictException(
        'An investigation is already open for this case, or the case has moved.',
      );
    }

    this.logger.log(`Investigation started: ${investigation.investigationNo}`);

    await this.notificationDispatcher.notify({
      ...notificationMessages.investigatorAssigned(
        investigation.id,
        investigation.investigationNo,
      ),
      actorId: user.sub,
      recipients: { userIds: [input.investigatorId] },
    });

    return investigation;
  }

  // ----- SUPER_ADMIN deletion -----

  async findDeleted(page: number, user: CurrentUserJwtPayload) {
    this.assertSuperAdmin(user);

    const { cases, total } = await this.caseRepository.findDeletedPaginated(
      (page - 1) * PAGE_SIZE,
      PAGE_SIZE,
    );

    return this.page(cases, total, page);
  }

  async remove(
    id: string,
    input: DeleteCaseInput,
    user: CurrentUserJwtPayload,
  ) {
    this.assertSuperAdmin(user);

    const deleted = await this.caseRepository.softDelete(id, user.sub, {
      reason: input.reason,
      memoReference: input.memoReference,
    });

    if (!deleted) {
      throw new NotFoundException('Investigation case not found.');
    }

    this.logger.log(`Investigation case deleted: ${id}`);
    return { message: 'Investigation case deleted.' };
  }

  async restore(id: string, user: CurrentUserJwtPayload) {
    this.assertSuperAdmin(user);

    if (!(await this.caseRepository.restore(id, user.sub))) {
      throw new NotFoundException('Deleted investigation case not found.');
    }

    this.logger.log(`Investigation case restored: ${id}`);
    return { message: 'Investigation case restored.' };
  }

  // ----- Shared checks -----

  private async viewerScope(user: CurrentUserJwtPayload): Promise<ViewerScope> {
    const office = await this.caseRepository.findOfficeType(user.officeId);

    if (!office) {
      throw new ForbiddenException('Your office was not found.');
    }

    return { user, officeType: office.type };
  }

  // Anything outside the user's scope is a 404.
  private async findVisibleCase(
    id: string,
    user: CurrentUserJwtPayload,
  ): Promise<AccessCase> {
    const scope = await this.viewerScope(user);
    const found = await this.caseRepository.findForAccess(id);

    if (!found || !isCaseVisible(found, scope)) {
      throw new NotFoundException('Investigation case not found.');
    }

    return found;
  }

  // The creator (while still a chief) or the handling office's chief.
  private mayEdit(found: AccessCase, user: CurrentUserJwtPayload): boolean {
    return (
      isHandlingChief(user, found.handlingOfficeId) ||
      (found.createdById === user.sub && isChief(user))
    );
  }

  private async assertAssignable(investigatorId: string, officeId: string) {
    const investigator = await this.caseRepository.findUser(investigatorId);

    if (
      !investigator ||
      !investigator.isActive ||
      !INVESTIGATOR_ROLES.includes(investigator.role) ||
      investigator.officeId !== officeId
    ) {
      throw new BadRequestException(
        'The assignee must be an active investigator of the handling office.',
      );
    }
  }

  // On update, a new subcategory must belong to the new or the current category.
  private async assertValidReferences(
    input: {
      categoryId?: string;
      subcategoryId?: string | null;
      establishmentId?: string | null;
    },
    currentCategoryId?: string,
  ) {
    if (
      input.categoryId &&
      !(await this.caseRepository.findCategory(input.categoryId))
    ) {
      throw new BadRequestException('Category not found.');
    }

    if (input.subcategoryId) {
      const subcategory = await this.caseRepository.findSubcategory(
        input.subcategoryId,
      );

      if (!subcategory) {
        throw new BadRequestException('Subcategory not found.');
      }

      const categoryId = input.categoryId ?? currentCategoryId;
      if (categoryId && subcategory.categoryId !== categoryId) {
        throw new BadRequestException(
          'The subcategory does not belong to the category.',
        );
      }
    }

    if (
      input.establishmentId &&
      !(await this.caseRepository.findEstablishment(input.establishmentId))
    ) {
      throw new BadRequestException('Establishment not found.');
    }
  }

  private assertSuperAdmin(user: CurrentUserJwtPayload) {
    if (user.role !== ROLE.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can do this.');
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
