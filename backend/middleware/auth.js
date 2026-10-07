import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';

function readBearerToken(value = '') {
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match?.[1]?.trim() || null;
}

function safeTokenEqual(provided, expected) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function authenticateUserToken(token) {
  if (!token || !isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    return error ? null : data?.user || null;
  } catch {
    return null;
  }
}

export async function requireUserAuth(req, res, next) {
  const user = await authenticateUserToken(readBearerToken(req.get('authorization')));
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  req.user = user;
  return next();
}

export async function authenticateAgentSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token ||
      readBearerToken(socket.handshake.headers?.authorization);

    if (safeTokenEqual(token, process.env.AGENT_API_TOKEN)) {
      socket.auth = { type: 'agent-token' };
      return next();
    }

    const user = await authenticateUserToken(token);
    if (!user) return next(new Error('Unauthorized'));
    socket.auth = { type: 'user-token', userId: user.id };
    return next();
  } catch (error) {
    console.error('[Auth] Socket authentication failed:', error);
    return next(new Error('Unauthorized'));
  }
}

export function parseAllowedOrigins(value = '') {
  return value.split(',').map(origin => origin.trim()).filter(Boolean);
}

export { readBearerToken, safeTokenEqual };
