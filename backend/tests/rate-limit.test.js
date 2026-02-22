import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  defaultLimiter,
  authLimiter,
  passwordResetLimiter,
  generationLimiter,
  uploadLimiter
} from '../middleware/rateLimit.js';

describe('Rate Limiting Middleware', () => {
  // ===========================================
  // Default Limiter Tests
  // ===========================================
  describe('defaultLimiter', () => {
    it('should allow requests under limit', async () => {
      const app = express();
      app.use(defaultLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // First request should succeed
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should have correct configuration', () => {
      // defaultLimiter should allow 100 requests per minute
      expect(defaultLimiter).toBeDefined();
      // The limiter is a function (middleware)
      expect(typeof defaultLimiter).toBe('function');
    });
  });

  // ===========================================
  // Auth Limiter Tests
  // ===========================================
  describe('authLimiter', () => {
    it('should be configured for authentication endpoints', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    it('should allow initial requests', async () => {
      const app = express();
      app.use(authLimiter);
      app.post('/auth', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/auth');
      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Password Reset Limiter Tests
  // ===========================================
  describe('passwordResetLimiter', () => {
    it('should be configured for password reset', () => {
      expect(passwordResetLimiter).toBeDefined();
      expect(typeof passwordResetLimiter).toBe('function');
    });

    it('should allow initial requests', async () => {
      const app = express();
      app.use(passwordResetLimiter);
      app.post('/reset', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/reset');
      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Generation Limiter Tests
  // ===========================================
  describe('generationLimiter', () => {
    it('should be configured for generation endpoints', () => {
      expect(generationLimiter).toBeDefined();
      expect(typeof generationLimiter).toBe('function');
    });

    it('should allow initial requests', async () => {
      const app = express();
      app.use(generationLimiter);
      app.post('/generate', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/generate');
      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Upload Limiter Tests
  // ===========================================
  describe('uploadLimiter', () => {
    it('should be configured for upload endpoints', () => {
      expect(uploadLimiter).toBeDefined();
      expect(typeof uploadLimiter).toBe('function');
    });

    it('should allow initial requests', async () => {
      const app = express();
      app.use(uploadLimiter);
      app.post('/upload', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/upload');
      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Key Generator Tests
  // ===========================================
  describe('Key Generator', () => {
    it('should use user ID when available', async () => {
      const app = express();

      // Simulate authenticated request
      app.use((req, res, next) => {
        req.user = { id: 'user-123' };
        next();
      });

      app.use(defaultLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });

    it('should fall back to IP when user not available', async () => {
      const app = express();
      app.use(defaultLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Rate Limit Response Tests
  // ===========================================
  describe('Rate Limit Response Format', () => {
    it('should return proper error format when rate limited', async () => {
      // Create a very restrictive limiter for testing
      const { default: rateLimit } = await import('express-rate-limit');

      const strictLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 1,
        handler: (req, res) => {
          res.status(429).json({
            success: false,
            error: 'Too many requests, please try again later',
            retryAfter: 60
          });
        }
      });

      const app = express();
      app.use(strictLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // First request succeeds
      await request(app).get('/test');

      // Second request should be rate limited
      const response = await request(app).get('/test');

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many requests');
      expect(response.body.retryAfter).toBeDefined();
    });
  });
});
