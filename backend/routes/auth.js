import express from 'express';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { requireUserAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login pour le Desktop Agent
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Supabase non configuré'
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

    res.json({
      success: true,
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || email.split('@')[0]
      }
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/auth/verify
 * Vérifie un token
 */
router.post('/verify', requireUserAuth, async (req, res) => {
  try {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.full_name || req.user.email.split('@')[0]
      }
    });

  } catch (error) {
    res.json({ valid: false });
  }
});

export default router;
