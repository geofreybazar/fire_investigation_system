import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { type UUID } from 'crypto';
import { NotificationService } from './notification.service.js';
import { NotificationRepository } from './notification.repository.js';
import { type NotificationInput } from './schema/notification.schema.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

const userId = '11111111-1111-4111-8111-111111111111' as UUID;
const otherUserId = '55555555-5555-4555-8555-555555555555' as UUID;

const currentUser: CurrentUserJwtPayload = {
  sub: userId,
  account_number: 'ACC001',
  role: 'REGIONAL_INVESTIGATOR',
  positionId: 'position-1',
  officeId: 'office-1',
};

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: {
    getUserNotificationSettings: ReturnType<typeof vi.fn>;
    updateNotificationSettings: ReturnType<typeof vi.fn>;
    findInbox: ReturnType<typeof vi.fn>;
    countUnread: ReturnType<typeof vi.fn>;
    markRead: ReturnType<typeof vi.fn>;
    markAllRead: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      getUserNotificationSettings: vi.fn(),
      updateNotificationSettings: vi.fn(),
      findInbox: vi.fn().mockResolvedValue({ notifications: [], total: 0 }),
      countUnread: vi.fn().mockResolvedValue(0),
      markRead: vi.fn().mockResolvedValue(1),
      markAllRead: vi.fn().mockResolvedValue(3),
      exists: vi.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserNotificationSettings', () => {
    it('returns the settings for the user', async () => {
      const settings = { id: 'settings-1', userId };
      repository.getUserNotificationSettings.mockResolvedValue(settings);

      await expect(
        service.getUserNotificationSettings(userId, currentUser),
      ).resolves.toBe(settings);
      expect(repository.getUserNotificationSettings).toHaveBeenCalledWith(
        userId,
      );
    });

    it('throws NotFoundException when no settings exist', async () => {
      repository.getUserNotificationSettings.mockResolvedValue(null);

      await expect(
        service.getUserNotificationSettings(userId, currentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it("forbids reading another user's settings", async () => {
      await expect(
        service.getUserNotificationSettings(otherUserId, currentUser),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.getUserNotificationSettings).not.toHaveBeenCalled();
    });
  });

  describe('updateNotificationSettings', () => {
    it('passes the update through to the repository', async () => {
      const input = {} as NotificationInput;

      await expect(
        service.updateNotificationSettings(userId, input, currentUser),
      ).resolves.toBeUndefined();
      expect(repository.updateNotificationSettings).toHaveBeenCalledWith(
        userId,
        input,
      );
    });

    it("forbids changing another user's settings", async () => {
      await expect(
        service.updateNotificationSettings(
          otherUserId,
          {} as NotificationInput,
          currentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.updateNotificationSettings).not.toHaveBeenCalled();
    });
  });

  describe('inbox', () => {
    it("lists only the current user's notifications, 10 per page", async () => {
      repository.findInbox.mockResolvedValue({ notifications: [], total: 25 });

      const result = await service.findInbox(3, currentUser);

      expect(repository.findInbox).toHaveBeenCalledWith(userId, 20, 10);
      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('counts unread notifications for the current user', async () => {
      repository.countUnread.mockResolvedValue(4);

      await expect(service.countUnread(currentUser)).resolves.toEqual({
        unread: 4,
      });
      expect(repository.countUnread).toHaveBeenCalledWith(userId);
    });

    it('marks a notification read', async () => {
      await service.markRead('n-1', currentUser);

      expect(repository.markRead).toHaveBeenCalledWith('n-1', userId);
    });

    it('treats an already-read notification as fine', async () => {
      repository.markRead.mockResolvedValue(0);
      repository.exists.mockResolvedValue(true);

      await expect(service.markRead('n-1', currentUser)).resolves.toEqual({
        message: 'Notification marked as read.',
      });
    });

    it("returns 404 for a missing or someone else's notification", async () => {
      repository.markRead.mockResolvedValue(0);

      await expect(service.markRead('n-1', currentUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.exists).toHaveBeenCalledWith('n-1', userId);
    });

    it("marks all of the current user's notifications read", async () => {
      await expect(service.markAllRead(currentUser)).resolves.toEqual({
        updated: 3,
      });
      expect(repository.markAllRead).toHaveBeenCalledWith(userId);
    });
  });
});
