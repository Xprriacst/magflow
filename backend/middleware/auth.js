import { supabase, supabaseAdmin, isSupabaseConfigured } from '../services/supabaseClient.js';

/**
 * Extract JWT token from Authorization header
 * Supports: "Bearer <token>" or plain "<token>"
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}

/**
 * Middleware: Verify JWT token and attach user to request
 * Use this middleware to protect routes that require authentication
 */
export async function verifyToken(req, res, next) {
  try {
    if (!isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = data.user;
    req.token = token;

    // Optionally fetch user profile for role/subscription info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      req.userProfile = profile;
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Middleware: Require specific roles (admin, user)
 * Must be used after verifyToken middleware
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userProfile) {
      return res.status(403).json({
        success: false,
        error: 'Profile not found'
      });
    }

    if (!roles.includes(req.userProfile.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

/**
 * Middleware: Check if user has remaining credits (1 crédit = 1 page)
 * Must be used after verifyToken middleware
 */
export function checkUsageLimit(req, res, next) {
  if (!req.userProfile) {
    return res.status(403).json({
      success: false,
      error: 'Profile not found'
    });
  }

  const { monthly_generations_used, monthly_limit, subscription_tier } = req.userProfile;

  // Pro users with unlimited (-1) can always generate
  if (monthly_limit === -1) {
    return next();
  }

  // Check if user has exceeded their limit
  if (monthly_generations_used >= monthly_limit) {
    return res.status(429).json({
      success: false,
      error: 'Crédits épuisés',
      errorCode: 'NO_CREDITS',
      credits: {
        used: monthly_generations_used,
        limit: monthly_limit,
        remaining: 0
      },
      subscription_tier,
      upgradeUrl: '/pricing'
    });
  }

  next();
}

/**
 * Middleware: Increment user's generation count
 * Call this AFTER successful generation
 */
export async function incrementUsageCount(userId) {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  try {
    // Increment monthly_generations_used
    const { error } = await supabaseAdmin.rpc('increment_generation_count', {
      user_id: userId
    });

    if (error) {
      console.error('[Auth] Failed to increment usage count:', error);
    }
  } catch (err) {
    console.error('[Auth] Error incrementing usage:', err);
  }
}

/**
 * Middleware: Log user action to usage_logs table
 */
export async function logUserAction(userId, action, metadata = {}, req = null) {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  try {
    const logEntry = {
      user_id: userId,
      action,
      metadata,
      ip_address: req?.ip || req?.connection?.remoteAddress || null,
      user_agent: req?.headers?.['user-agent'] || null
    };

    const { error } = await supabaseAdmin
      .from('usage_logs')
      .insert([logEntry]);

    if (error) {
      console.error('[Auth] Failed to log action:', error);
    }
  } catch (err) {
    console.error('[Auth] Error logging action:', err);
  }
}

/**
 * Optional auth middleware - doesn't fail if no token, just attaches user if present
 * Useful for routes that work both authenticated and unauthenticated
 */
export async function optionalAuth(req, res, next) {
  try {
    if (!isSupabaseConfigured) {
      return next();
    }

    const token = extractToken(req);

    if (!token) {
      return next();
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user) {
      req.user = data.user;
      req.token = token;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        req.userProfile = profile;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
}

export default {
  verifyToken,
  requireRole,
  checkUsageLimit,
  incrementUsageCount,
  logUserAction,
  optionalAuth
};
