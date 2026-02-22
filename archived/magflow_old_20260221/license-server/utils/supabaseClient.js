import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseInstance = null;

if (!url || !serviceKey) {
  console.warn(
    '[license-server] Variables SUPABASE_URL et SUPABASE_SERVICE_KEY manquantes. Certaines routes échoueront.'
  );
} else {
  supabaseInstance = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const supabase = supabaseInstance;

export default supabase;
