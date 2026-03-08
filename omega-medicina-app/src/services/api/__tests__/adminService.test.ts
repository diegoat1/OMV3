// Admin Service Tests
import { rest, RestRequest, RestContext } from 'msw';
import { setupServer } from 'msw/node';
import { adminService, DashboardStats, AdminUser } from '../adminService';
import { ENDPOINTS } from '../config';

// Mock server setup
const server = setupServer(
  // Mock dashboard stats endpoint
  rest.get(`${ENDPOINTS.ADMIN_DASHBOARD_STATS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        total_users: 69,
        active_users: 65,
        doctors: 12,
        admins: 1,
        nutricionistas: 8,
        entrenadores: 5,
        pending_verification: 4,
      }
    }));
  }),

  // Mock auth users endpoint
  rest.get(`${ENDPOINTS.ADMIN_AUTH_USERS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        users: [
          {
            id: 1,
            email: 'admin@test.com',
            display_name: 'Admin User',
            role: 'admin',
            is_active: true,
            status: 'active',
            telefono: '+1234567890',
            desired_role: 'admin',
            patient_dni: '',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            email: 'doctor@test.com',
            display_name: 'Doctor User',
            role: 'doctor',
            is_active: true,
            status: 'active',
            telefono: '+1234567891',
            desired_role: 'doctor',
            patient_dni: '',
            created_at: '2024-01-02T00:00:00Z',
          }
        ]
      }
    }));
  }),

  // Mock pending users endpoint
  rest.get(`${ENDPOINTS.ADMIN_PENDING_USERS}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        users: [
          {
            id: 3,
            email: 'pending@test.com',
            display_name: 'Pending User',
            role: 'user',
            is_active: false,
            status: 'pending',
            telefono: '+1234567892',
            desired_role: 'user',
            patient_dni: '12345678',
            created_at: '2024-01-03T00:00:00Z',
          }
        ]
      }
    }));
  }),

  // Mock approve user endpoint
  rest.post(`${ENDPOINTS.ADMIN_APPROVE_USER}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      message: 'User approved successfully'
    }));
  }),

  // Mock reject user endpoint
  rest.post(`${ENDPOINTS.ADMIN_REJECT_USER}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      message: 'User rejected successfully'
    }));
  }),

  // Mock toggle active endpoint
  rest.post(`${ENDPOINTS.ADMIN_TOGGLE_ACTIVE}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      message: 'User status updated successfully'
    }));
  }),

  // Mock update role endpoint
  rest.post(`${ENDPOINTS.ADMIN_UPDATE_ROLE}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      message: 'User role updated successfully'
    }));
  }),

  // Mock delete user endpoint
  rest.delete(`${ENDPOINTS.ADMIN_DELETE_USER}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      message: 'User deleted successfully'
    }));
  }),

  // Mock audit log endpoint
  rest.get(`${ENDPOINTS.ADMIN_AUDIT}`, (req: RestRequest, res: any, ctx: RestContext) => {
    return res(ctx.json({
      success: true,
      data: {
        entries: [
          {
            id: 1,
            user_id: 1,
            user_name: 'Admin User',
            action: 'LOGIN',
            details: 'User logged in',
            ip_address: '192.168.1.1',
            created_at: '2024-01-01T10:00:00Z',
          }
        ]
      }
    }));
  })
);

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

describe('Admin Service', () => {
  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics successfully', async () => {
      const result = await adminService.getDashboardStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total_users: 69,
        active_users: 65,
        doctors: 12,
        admins: 1,
        nutricionistas: 8,
        entrenadores: 5,
        pending_verification: 4,
      });
    });

    it('should handle network errors', async () => {
      server.use(
        rest.get(`${ENDPOINTS.ADMIN_DASHBOARD_STATS}`, (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        })
      );

      const result = await adminService.getDashboardStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });
  });

  describe('getAuthUsers', () => {
    it('should fetch authenticated users successfully', async () => {
      const result = await adminService.getAuthUsers();

      expect(result.success).toBe(true);
      expect(result.data?.users).toHaveLength(2);
      expect(result.data?.users[0]).toMatchObject({
        id: 1,
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      });
    });
  });

  describe('getPendingUsers', () => {
    it('should fetch pending users successfully', async () => {
      const result = await adminService.getPendingUsers();

      expect(result.success).toBe(true);
      expect(result.data?.users).toHaveLength(1);
      expect(result.data?.users[0]).toMatchObject({
        id: 3,
        email: 'pending@test.com',
        status: 'pending',
        is_active: false,
      });
    });
  });

  describe('User Management Operations', () => {
    it('should approve user successfully', async () => {
      const result = await adminService.approveUser(3);

      expect(result.success).toBe(true);
    });

    it('should reject user successfully', async () => {
      const result = await adminService.rejectUser(3);

      expect(result.success).toBe(true);
    });

    it('should toggle user active status successfully', async () => {
      const result = await adminService.toggleActive(3);

      expect(result.success).toBe(true);
    });

    it('should update user role successfully', async () => {
      const result = await adminService.updateRole(3, 'doctor');

      expect(result.success).toBe(true);
    });

    it('should delete user successfully', async () => {
      const result = await adminService.deleteUser(3);

      expect(result.success).toBe(true);
    });
  });

  describe('getAuditLog', () => {
    it('should fetch audit log successfully', async () => {
      const result = await adminService.getAuditLog(50);

      expect(result.success).toBe(true);
      expect(result.data?.entries).toHaveLength(1);
      expect(result.data?.entries[0]).toMatchObject({
        id: 1,
        user_id: 1,
        action: 'LOGIN',
        user_name: 'Admin User',
      });
    });

    it('should use default limit when not specified', async () => {
      const result = await adminService.getAuditLog();

      expect(result.success).toBe(true);
    });
  });
});
