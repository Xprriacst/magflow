import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createMessage } = vi.hoisted(() => ({
  createMessage: vi.fn()
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = { create: createMessage };
  }
}));

const { analyzeContentStructure, CLAUDE_MODEL } = await import('../services/openaiService.js');

describe('Service Claude', () => {
  beforeEach(() => {
    createMessage.mockReset();
  });

  it('utilise l’identifiant de modèle Claude configuré', async () => {
    createMessage.mockResolvedValue({
      content: [{ text: '{"titre_principal":"Titre test"}' }]
    });

    await analyzeContentStructure('Contenu suffisamment long pour lancer une analyse de structure éditoriale.');

    expect(CLAUDE_MODEL).toBe('claude-sonnet-5-5');
    expect(createMessage).toHaveBeenCalledWith(expect.objectContaining({
      model: CLAUDE_MODEL
    }));
  });

  it('remonte explicitement une erreur de l’API Claude', async () => {
    createMessage.mockRejectedValue(new Error('model not found'));

    await expect(analyzeContentStructure('Contenu suffisamment long pour lancer une analyse de structure éditoriale.'))
      .rejects.toThrow('Claude API Error: model not found');
  });
});
