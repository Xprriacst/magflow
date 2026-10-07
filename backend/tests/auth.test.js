import { describe, expect, it } from 'vitest';
import {
  authenticateAgentSocket,
  parseAllowedOrigins,
  readBearerToken,
  safeTokenEqual
} from '../middleware/auth.js';

describe('authentication helpers', () => {
  it('lit uniquement un jeton Bearer', () => {
    expect(readBearerToken('Bearer secret')).toBe('secret');
    expect(readBearerToken('Basic secret')).toBeNull();
  });

  it('compare les jetons', () => {
    expect(safeTokenEqual('secret', 'secret')).toBe(true);
    expect(safeTokenEqual('secret', 'other')).toBe(false);
    expect(safeTokenEqual('', 'secret')).toBe(false);
  });

  it('normalise la liste CORS configurée', () => {
    expect(parseAllowedOrigins('https://app.test, https://admin.test ')).toEqual([
      'https://app.test',
      'https://admin.test'
    ]);
  });

  it('refuse un socket sans jeton', async () => {
    const socket = { handshake: { auth: {}, headers: {} } };
    const error = await new Promise(resolve => authenticateAgentSocket(socket, resolve));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Unauthorized');
  });

  it('accepte le jeton dédié de l’agent', async () => {
    process.env.AGENT_API_TOKEN = 'agent-secret';
    const socket = { handshake: { auth: { token: 'agent-secret' }, headers: {} } };
    const error = await new Promise(resolve => authenticateAgentSocket(socket, resolve));
    expect(error).toBeUndefined();
    expect(socket.auth).toEqual({ type: 'agent-token' });
    delete process.env.AGENT_API_TOKEN;
  });
});
