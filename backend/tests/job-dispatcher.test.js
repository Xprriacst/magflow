import { describe, expect, it, vi } from 'vitest';
import { isAgentConnected, sendJobToAgent } from '../services/jobDispatcher.js';

describe('jobDispatcher', () => {
  it('trouve un agent avec son agentId et lui envoie le job attendu', () => {
    const emit = vi.fn();
    const to = vi.fn(() => ({ emit }));
    const agents = new Map([
      ['renderer-1', { socketId: 'socket-42', userId: 'operator-1' }]
    ]);
    const job = { id: 'job-1' };

    expect(sendJobToAgent({ to }, agents, 'renderer-1', job)).toBe(true);
    expect(to).toHaveBeenCalledWith('socket-42');
    expect(emit).toHaveBeenCalledWith('job:new', job);
    expect(isAgentConnected(agents, 'renderer-1')).toBe(true);
  });

  it('ne confond pas userId et agentId', () => {
    const io = { to: vi.fn() };
    const agents = new Map([
      ['renderer-1', { socketId: 'socket-42', userId: 'operator-1' }]
    ]);

    expect(sendJobToAgent(io, agents, 'operator-1', { id: 'job-1' })).toBe(false);
    expect(io.to).not.toHaveBeenCalled();
  });
});
