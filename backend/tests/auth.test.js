import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock Supabase before importing routes
vi.mock('../services/supabaseClient.js', () => {
  const mockUser = {
    id: 'test-user-id-123',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const mockSession = {
    access_token: 'mock-access-token-12345',
    refresh_token: 'mock-refresh-token-67890',
    expires_at: Math.floor(Date.now() / 1000) + 3600
  };

  const mockProfile = {
    id: 'test-user-id-123',
    email: 'test@example.com',
    company_name: 'Test Company',
    subscription_tier: 'free',
    subscription_status: 'active',
    monthly_generations_used: 2,
    monthly_limit: 5,
    role: 'user',
    usage_reset_date: new Date().toISOString()
  };

  const mockAdminProfile = {
    ...mockProfile,
    id: 'admin-user-id-456',
    email: 'admin@example.com',
    role: 'admin',
    monthly_limit: -1
  };

  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockImplementation((token) => {
          if (token === 'valid-token') {
            return Promise.resolve({ data: { user: mockUser }, error: null });
          }
          if (token === 'admin-token') {
            return Promise.resolve({
              data: { user: { ...mockUser, id: 'admin-user-id-456', email: 'admin@example.com' } },
              error: null
            });
          }
          return Promise.resolve({ data: { user: null }, error: { message: 'Invalid token' } });
        }),
        refreshSession: vi.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null
        }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
        resend: vi.fn().mockResolvedValue({ error: null })
      }
    },
    supabaseAdmin: {
      from: vi.fn().mockImplementation((table) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field, value) => {
          if (value === 'admin-user-id-456') {
            return {
              single: vi.fn().mockResolvedValue({ data: mockAdminProfile, error: null }),
              select: vi.fn().mockReturnThis()
            };
          }
          return {
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
            select: vi.fn().mockReturnThis()
          };
        }),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      }))
    }
  };
});

// Import routes after mocking
import authRoutes from '../routes/auth.js';

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Authentication Routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  // ===========================================
  // Registration Tests
  // ===========================================
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          fullName: 'New User',
          companyName: 'New Company'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject registration without email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email and password are required');
    });

    it('should reject registration without password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject short passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '1234567' // 7 chars, less than 8
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 8 characters');
    });
  });

  // ===========================================
  // Login Tests
  // ===========================================
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.role).toBeDefined();
      expect(response.body.user.subscriptionTier).toBeDefined();
    });

    it('should reject login without email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================
  // Token Verification Tests
  // ===========================================
  describe('POST /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe('test-user-id-123');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'invalid-token' });

      expect(response.body.valid).toBe(false);
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.valid).toBe(false);
    });
  });

  // ===========================================
  // Get Current User Tests
  // ===========================================
  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.subscriptionTier).toBe('free');
      // Credits info is now returned separately
      expect(response.body.credits).toBeDefined();
      expect(response.body.credits.limit).toBe(5);
      expect(response.body.credits.remaining).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No authentication token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================
  // Refresh Token Tests
  // ===========================================
  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Refresh token is required');
    });
  });

  // ===========================================
  // Password Reset Tests
  // ===========================================
  describe('POST /api/auth/password-reset', () => {
    it('should accept password reset request', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should not reveal if email exists
      expect(response.body.message).toContain('If an account exists');
    });

    it('should reject without email', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================
  // Password Update Tests
  // ===========================================
  describe('POST /api/auth/password-update', () => {
    it('should update password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/password-update')
        .set('Authorization', 'Bearer valid-token')
        .send({ newPassword: 'newpassword123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/password-update')
        .set('Authorization', 'Bearer valid-token')
        .send({ newPassword: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 8 characters');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/password-update')
        .send({ newPassword: 'newpassword123' });

      expect(response.status).toBe(401);
    });
  });

  // ===========================================
  // Logout Tests
  // ===========================================
  describe('POST /api/auth/logout', () => {
    it('should logout with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  // ===========================================
  // Resend Confirmation Tests
  // ===========================================
  describe('POST /api/auth/resend-confirmation', () => {
    it('should accept resend request', async () => {
      const response = await request(app)
        .post('/api/auth/resend-confirmation')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject without email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-confirmation')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // ===========================================
  // Profile Update Tests
  // ===========================================
  describe('PUT /api/auth/me', () => {
    it('should update profile with valid token', async () => {
      const response = await request(app)
        .put('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .send({
          fullName: 'Updated Name',
          companyName: 'Updated Company'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/me')
        .send({ fullName: 'Updated Name' });

      expect(response.status).toBe(401);
    });
  });
});

describe('Auth Middleware', () => {
  describe('verifyToken', () => {
    it('should accept Bearer token format', async () => {
      const app = createApp();
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });

    it('should accept plain token format', async () => {
      const app = createApp();
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'valid-token');

      expect(response.status).toBe(200);
    });

    it('should reject missing Authorization header', async () => {
      const app = createApp();
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('No authentication token');
    });
  });
});
