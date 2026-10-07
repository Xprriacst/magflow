import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import magazineRoutes from '../routes/magazine.js';

function createApp({ connectedAgents = new Map(), sendJobToAgent } = {}) {
  const app = express();
  app.use(express.json());
  app.set('connectedAgents', connectedAgents);
  app.set('sendJobToAgent', sendJobToAgent);
  app.use('/api/magazine', magazineRoutes);
  return app;
}

const payload = {
  contentStructure: {
    titre_principal: 'T01',
    chapo: 'Recette du chemin unique',
    corps_article: 'Contenu de test'
  },
  template: { id: 'template-1', name: 'Gabarit T01' },
  images: ['https://example.test/image.jpg']
};

describe('POST /api/magazine/generate', () => {
  it('refuse tout rendu direct quand aucun agent n\'est disponible', async () => {
    const response = await request(createApp())
      .post('/api/magazine/generate')
      .send(payload);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: 'Aucun agent de rendu disponible'
    });
  });

  it('place T01 dans la file de l\'agent et retourne un statut asynchrone', async () => {
    const sendJobToAgent = vi.fn(() => true);
    const app = createApp({
      connectedAgents: new Map([['renderer-1', { socketId: 'socket-1' }]]),
      sendJobToAgent
    });

    const response = await request(app)
      .post('/api/magazine/generate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      status: 'processing'
    });
    expect(response.body.generationId).toBe(response.body.projectId);
    expect(sendJobToAgent).toHaveBeenCalledOnce();
    expect(sendJobToAgent).toHaveBeenCalledWith(
      'renderer-1',
      expect.objectContaining({
        id: response.body.generationId,
        template_id: 'template-1',
        titre: 'T01'
      })
    );
  });
});
