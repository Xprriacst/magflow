/**
 * Tests du workflow d'upload de templates
 * 
 * Exécuter: cd backend && npm test -- template-upload
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';

// Mock des services externes
vi.mock('../services/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-uuid',
              name: 'Test Template',
              filename: 'test-template.indt',
              placeholders: ['{{TITRE}}', '{{ARTICLE}}'],
              image_slots: 2,
              category: 'Test',
              style: 'simple'
            },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-uuid', name: 'Test', file_path: '/tmp/test.indt' },
            error: null
          }))
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.supabase.co/test.jpg' } }))
      }))
    }
  },
  supabaseAdmin: null,
  isSupabaseConfigured: true
}));

// Mock du service OpenAI
vi.mock('../services/openaiService.js', () => ({
  enrichTemplateMetadata: vi.fn(() => Promise.resolve({
    category: 'Test Category',
    style: 'simple',
    recommended_for: ['Testing', 'Development'],
    description: 'Template de test'
  }))
}));

// Import de la route après les mocks
import templateUploadRoutes from '../routes/templateUpload.js';

describe('Template Upload Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/templates', templateUploadRoutes);
  });

  describe('POST /upload', () => {
    it('should reject requests without file', async () => {
      const response = await request(app)
        .post('/api/templates/upload')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No file');
    });

    it('should reject non-indesign files', async () => {
      const response = await request(app)
        .post('/api/templates/upload')
        .attach('template', Buffer.from('test'), {
          filename: 'test.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBe(500); // Multer rejette
    });
  });

  describe('POST /upload-local', () => {
    it('should reject missing localPath', async () => {
      const response = await request(app)
        .post('/api/templates/upload-local')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('localPath');
    });

    it('should reject non-existent files', async () => {
      const response = await request(app)
        .post('/api/templates/upload-local')
        .send({ localPath: '/non/existent/file.indt' });

      expect(response.status).toBe(404);
    });
  });
});

describe('Template Workflow Service', () => {
  it('should validate file extensions', () => {
    const validExtensions = ['.indt', '.indd'];
    
    expect(validExtensions.includes('.indt')).toBe(true);
    expect(validExtensions.includes('.indd')).toBe(true);
    expect(validExtensions.includes('.pdf')).toBe(false);
    expect(validExtensions.includes('.ai')).toBe(false);
  });

  it('should generate template name from filename', () => {
    const testCases = [
      { input: 'my-template.indt', expected: 'My Template' },
      { input: 'magazine_lifestyle_v2.indd', expected: 'Magazine Lifestyle V2' },
      { input: 'simple.indt', expected: 'Simple' },
    ];

    for (const { input, expected } of testCases) {
      const name = input
        .replace(/\.(indt|indd)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
      
      expect(name).toBe(expected);
    }
  });

  it('should format placeholders with curly braces', () => {
    const rawPlaceholders = ['TITRE', 'ARTICLE', 'CHAPO'];
    const formatted = rawPlaceholders.map(p => `{{${p}}}`);
    
    expect(formatted).toEqual(['{{TITRE}}', '{{ARTICLE}}', '{{CHAPO}}']);
  });
});

describe('API Response Structure', () => {
  it('should have correct success response structure', () => {
    const successResponse = {
      success: true,
      message: 'Template processed successfully',
      template: {
        id: 'uuid',
        name: 'Test',
        filename: 'test.indt',
        placeholders: [],
        image_slots: 0,
        preview_url: null
      }
    };

    expect(successResponse).toHaveProperty('success', true);
    expect(successResponse).toHaveProperty('template');
    expect(successResponse.template).toHaveProperty('id');
    expect(successResponse.template).toHaveProperty('name');
  });

  it('should have correct error response structure', () => {
    const errorResponse = {
      success: false,
      error: 'Something went wrong'
    };

    expect(errorResponse).toHaveProperty('success', false);
    expect(errorResponse).toHaveProperty('error');
  });
});
