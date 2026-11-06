import { auditChanges, auditSnapshot, recordAudit } from './audit.writer.js';

describe('audit writer', () => {
  describe('auditChanges', () => {
    it('returns only the listed fields that changed', () => {
      const before = { name: 'A', type: 'X', password: 'old-hash' };
      const after = { name: 'B', type: 'X', password: 'new-hash' };

      expect(auditChanges(before, after, ['name', 'type'])).toEqual({
        name: { from: 'A', to: 'B' },
      });
    });

    it('treats undefined and null as the same value', () => {
      expect(
        auditChanges({ middle_name: undefined }, { middle_name: null }, [
          'middle_name',
        ]),
      ).toEqual({});
    });

    it('stores dates as ISO strings', () => {
      const from = new Date('2026-10-01T00:00:00.000Z');
      const to = new Date('2026-10-02T00:00:00.000Z');

      expect(auditChanges({ at: from }, { at: to }, ['at'])).toEqual({
        at: { from: from.toISOString(), to: to.toISOString() },
      });
    });
  });

  describe('auditSnapshot', () => {
    it('keeps only the listed fields', () => {
      expect(
        auditSnapshot({ name: 'A', password: 'hash', regionCode: null }, [
          'name',
          'regionCode',
        ]),
      ).toEqual({ name: 'A', regionCode: null });
    });
  });

  describe('recordAudit', () => {
    it('omits changes when there are none', async () => {
      const tx = { auditLog: { create: vi.fn() } };

      await recordAudit(tx as never, {
        actorId: 'actor-1',
        action: 'USER_PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: 'user-1',
      });

      expect(tx.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'actor-1',
          action: 'USER_PASSWORD_CHANGED',
          entityType: 'USER',
          entityId: 'user-1',
        },
      });
    });
  });
});
