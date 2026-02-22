import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' }
};

const mockProfile = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  role: 'user',
  subscription_tier: 'free',
  monthly_generations_used: 3,
  monthly_limit: 5
};

const mockAdminProfile = {
  ...mockProfile,
  id: 'admin-id',
  role: 'admin',
  monthly_limit: -1
};

vi.mock('../services/supabaseClient.js', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getUser: vi.fn()
    }
  },
  supabaseAdmin: {
    from: vi.fn()
  }
}));

import { verifyToken, requireRole, checkUsageLimit, optionalAuth } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../services/supabaseClient.js';

describe('Auth Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      ip: '127.0.0.1'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  // ===========================================
  // verifyToken Tests
  // ===========================================
  describe('verifyToken', () => {
    it('should call next() with valid Bearer token', async () => {
      req.headers.authorization = 'Bearer valid-token';

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      });

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(req.userProfile).toEqual(mockProfile);
    });

    it('should call next() with plain token', async () => {
      req.headers.authorization = 'plain-token';

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      });

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(supabase.auth.getUser).toHaveBeenCalledWith('plain-token');
    });

    it('should return 401 without authorization header', async () => {
      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No authentication token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // requireRole Tests
  // ===========================================
  describe('requireRole', () => {
    it('should call next() for matching role', () => {
      req.userProfile = mockProfile;

      const middleware = requireRole('user');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next() for admin when multiple roles allowed', () => {
      req.userProfile = mockAdminProfile;

      const middleware = requireRole('user', 'admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for non-matching role', () => {
      req.userProfile = mockProfile;

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when profile missing', () => {
      req.userProfile = null;

      const middleware = requireRole('user');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Profile not found'
      });
    });
  });

  // ===========================================
  // checkUsageLimit Tests
  // ===========================================
  describe('checkUsageLimit', () => {
    it('should call next() when under limit', () => {
      req.userProfile = {
        ...mockProfile,
        monthly_generations_used: 2,
        monthly_limit: 5
      };

      checkUsageLimit(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next() for unlimited users (monthly_limit = -1)', () => {
      req.userProfile = {
        ...mockProfile,
        monthly_generations_used: 100,
        monthly_limit: -1
      };

      checkUsageLimit(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 429 when at limit', () => {
      req.userProfile = {
        ...mockProfile,
        monthly_generations_used: 5,
        monthly_limit: 5,
        subscription_tier: 'free'
      };

      checkUsageLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Crédits épuisés',
        errorCode: 'NO_CREDITS',
        credits: {
          used: 5,
          limit: 5,
          remaining: 0
        },
        subscription_tier: 'free'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 429 when over limit', () => {
      req.userProfile = {
        ...mockProfile,
        monthly_generations_used: 10,
        monthly_limit: 5
      };

      checkUsageLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when profile missing', () => {
      req.userProfile = null;

      checkUsageLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ===========================================
  // optionalAuth Tests
  // ===========================================
  describe('optionalAuth', () => {
    it('should call next() without token', async () => {
      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should attach user with valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      supabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      });

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(req.userProfile).toEqual(mockProfile);
    });

    it('should continue without user on invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
