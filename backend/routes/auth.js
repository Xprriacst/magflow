import express from 'express';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../services/supabaseClient.js';
import { verifyToken, logUserAction } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, fullName, companyName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
          company_name: companyName || null
        }
      }
    });

    if (error) {
      console.error('[Auth] Registration error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Update profile with company name if provided
    if (data.user && companyName && supabaseAdmin) {
      await supabaseAdmin
        .from('profiles')
        .update({ company_name: companyName })
        .eq('id', data.user.id);
    }

    // Log the signup action
    if (data.user) {
      await logUserAction(data.user.id, 'signup', { email }, req);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || email.split('@')[0]
      } : null,
      session: data.session ? {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      } : null
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    // Update last_login_at in profile
    if (data.user && supabaseAdmin) {
      await supabaseAdmin
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // Log the login action
      await logUserAction(data.user.id, 'login', { email }, req);
    }

    // Fetch user profile
    let profile = null;
    if (data.user && supabaseAdmin) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      profile = profileData;
    }

    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: profile?.role || 'user',
        subscriptionTier: profile?.subscription_tier || 'free',
        monthlyGenerationsUsed: profile?.monthly_generations_used || 0,
        monthlyLimit: profile?.monthly_limit || 5
      }
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout current session
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Logout error:', error);
      // Still return success as token is invalidated client-side
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh the access token using refresh token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at
    });

  } catch (error) {
    console.error('[Auth] Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during token refresh'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const profile = req.userProfile;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        emailVerified: user.email_confirmed_at != null,
        createdAt: user.created_at
      },
      profile: profile ? {
        role: profile.role,
        companyName: profile.company_name,
        subscriptionTier: profile.subscription_tier,
        subscriptionStatus: profile.subscription_status,
        monthlyGenerationsUsed: profile.monthly_generations_used,
        monthlyLimit: profile.monthly_limit,
        usageResetDate: profile.usage_reset_date
      } : null
    });

  } catch (error) {
    console.error('[Auth] Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', verifyToken, async (req, res) => {
  try {
    const { fullName, companyName } = req.body;
    const userId = req.user.id;

    // Update auth metadata
    if (fullName) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) {
        console.error('[Auth] Update auth metadata error:', authError);
      }
    }

    // Update profile
    if (supabaseAdmin) {
      const updateData = {};
      if (companyName !== undefined) updateData.company_name = companyName;

      if (Object.keys(updateData).length > 0) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (profileError) {
          console.error('[Auth] Update profile error:', profileError);
        }
      }
    }

    // Fetch updated profile
    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile ? {
        role: updatedProfile.role,
        companyName: updatedProfile.company_name,
        subscriptionTier: updatedProfile.subscription_tier,
        subscriptionStatus: updatedProfile.subscription_status,
        monthlyGenerationsUsed: updatedProfile.monthly_generations_used,
        monthlyLimit: updatedProfile.monthly_limit
      } : null
    });

  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during profile update'
    });
  }
});

/**
 * POST /api/auth/password-reset
 * Request a password reset email
 */
router.post('/password-reset', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
    });

    if (error) {
      console.error('[Auth] Password reset error:', error);
      // Don't reveal if email exists or not
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('[Auth] Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset'
    });
  }
});

/**
 * POST /api/auth/password-update
 * Update password (requires authentication)
 */
router.post('/password-update', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('[Auth] Password update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password update'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify a JWT token (backwards compatible)
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false });
    }

    if (!isSupabaseConfigured) {
      return res.status(500).json({ valid: false, error: 'Authentication service not configured' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.json({ valid: false });
    }

    // Fetch profile for additional data
    let profile = null;
    if (supabaseAdmin) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      profile = profileData;
    }

    res.json({
      valid: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
        role: profile?.role || 'user',
        subscriptionTier: profile?.subscription_tier || 'free'
      }
    });

  } catch (error) {
    res.json({ valid: false });
  }
});

/**
 * POST /api/auth/resend-confirmation
 * Resend email confirmation
 */
router.post('/resend-confirmation', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });

    if (error) {
      console.error('[Auth] Resend confirmation error:', error);
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a confirmation link has been sent.'
    });

  } catch (error) {
    console.error('[Auth] Resend confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
