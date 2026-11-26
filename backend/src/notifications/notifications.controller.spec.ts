import { NotificationsController } from './notifications.controller';

describe('NotificationsController Overdue Alert Visibility', () => {
  const buildController = () => {
    const mockPrisma: any = {
      $transaction: jest.fn().mockResolvedValue([[], 0]),
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      notificationRecipient: {
        count: jest.fn().mockResolvedValue(3),
      },
    };
    return { controller: new NotificationsController(mockPrisma), mockPrisma };
  };

  it.each(['STORES', 'STOR', 'STRS'])(
    'includes MATERIAL_ISSUE_OVERDUE in allowed event types for department %s',
    async (departmentCode) => {
      const { controller, mockPrisma } = buildController();
      const req: any = {
        user: {
          id: 'user-stores-1',
          role: { roleName: 'Stores Executive' },
          department: { departmentCode },
        },
      };

      await controller.getUnreadCount(req);
      expect(mockPrisma.notificationRecipient.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          notification: expect.objectContaining({
            eventType: { in: expect.arrayContaining(['MATERIAL_ISSUE_OVERDUE']) },
          }),
        }),
      });
    },
  );

  it.each(['Senior Manager', 'General Manager'])(
    'includes MATERIAL_ISSUE_OVERDUE in allowed event types for %s',
    async (roleName) => {
      const { controller, mockPrisma } = buildController();
      const req: any = {
        user: {
          id: 'user-mgr-1',
          role: { roleName },
          department: { departmentCode: 'MGMT' },
        },
      };

      await controller.list(req, {} as any);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventType: { in: expect.arrayContaining(['MATERIAL_ISSUE_OVERDUE']) },
          }),
        }),
      );
    },
  );
});
