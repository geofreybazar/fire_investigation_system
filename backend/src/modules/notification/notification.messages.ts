import {
  NotificationEntityType,
  NotificationType,
} from '../../generated/prisma/enums.js';

// Wording of each workflow notification (REQUIREMENTS.md Q-21).

interface Message {
  type: NotificationType;
  title: string;
  body: string;
  entityType: NotificationEntityType;
  entityId: string;
}

const investigationCase = (
  type: NotificationType,
  id: string,
  title: string,
  body: string,
): Message => ({
  type,
  title,
  body,
  entityType: 'INVESTIGATION_CASE',
  entityId: id,
});

const investigation = (
  type: NotificationType,
  id: string,
  title: string,
  body: string,
): Message => ({
  type,
  title,
  body,
  entityType: 'INVESTIGATION',
  entityId: id,
});

export const notificationMessages = {
  caseReferred: (caseId: string, caseNo: string) =>
    investigationCase(
      'CASE_REFERRED',
      caseId,
      'Case referred to your office',
      `Investigation case ${caseNo} was referred to your office.`,
    ),

  investigatorAssigned: (id: string, investigationNo: string) =>
    investigation(
      'INVESTIGATOR_ASSIGNED',
      id,
      'Investigation assigned to you',
      `You are assigned investigation ${investigationNo}.`,
    ),

  reportSubmitted: (id: string, investigationNo: string) =>
    investigation(
      'REPORT_SUBMITTED',
      id,
      'Report submitted for review',
      `The report for investigation ${investigationNo} is ready for your review.`,
    ),

  reportApproved: (id: string, investigationNo: string) =>
    investigation(
      'REPORT_APPROVED',
      id,
      'Report approved',
      `Your report for investigation ${investigationNo} was approved.`,
    ),

  reportRejected: (
    id: string,
    investigationNo: string,
    remarks?: string | null,
  ) =>
    investigation(
      'REPORT_REJECTED',
      id,
      'Report returned for changes',
      `Your report for investigation ${investigationNo} was rejected${remarks ? `: ${remarks}` : '.'}`,
    ),
};
