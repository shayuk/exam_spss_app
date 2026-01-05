import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper function to check if value is a placeholder (contains Hebrew or placeholder text)
const isPlaceholder = (value: string | undefined): boolean => {
  if (!value || typeof value !== 'string') return true;
  // Check for Hebrew characters or common placeholder patterns
  const hebrewPattern = /[\u0590-\u05FF]/;
  const placeholderPatterns = ['placeholder', 'הכנס', 'שלך', 'your', 'example'];
  return hebrewPattern.test(value) || placeholderPatterns.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Helper function to validate URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (isPlaceholder(url)) return false;
  // URL must start with https:// and include .supabase.co
  return url.startsWith('https://') && url.includes('.supabase.co');
};

// Helper function to validate anon key
const isValidAnonKey = (key: string | undefined): boolean => {
  if (!key || typeof key !== 'string') return false;
  if (isPlaceholder(key)) return false;
  // Supabase publishable keys start with sb_publishable_ and must be at least 20 chars
  if (key.startsWith('sb_publishable_')) {
    return key.length >= 20; // Minimum length for publishable keys
  }
  // Legacy anon keys (JWT tokens) should be at least 20 chars
  return key.length >= 20;
};

// Check if Supabase is properly configured
const isSupabaseConfigured = isValidUrl(supabaseUrl) && isValidAnonKey(supabaseAnonKey);

// Log configuration status (only in dev mode)
if (import.meta.env.DEV) {
  if (!isSupabaseConfigured) {
    console.error('[SUPABASE CONFIG ERROR] Supabase is not properly configured:');
    const urlValid = isValidUrl(supabaseUrl);
    const keyValid = isValidAnonKey(supabaseAnonKey);
    if (!urlValid) {
      console.error('  ❌ VITE_SUPABASE_URL:', supabaseUrl || 'MISSING', '- Must start with https:// and include .supabase.co');
    } else {
      console.log('  ✅ VITE_SUPABASE_URL: Valid');
    }
    if (!keyValid) {
      console.error('  ❌ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING', '- Must start with sb_publishable_ and be at least 20 characters');
    } else {
      console.log('  ✅ VITE_SUPABASE_ANON_KEY: Valid');
    }
    console.error('  Please update .env.local with your actual Supabase credentials from: https://app.supabase.com');
  } else {
    console.log('[SUPABASE] Configuration valid');
  }
}

// Create client only if env vars are valid, otherwise create a dummy client that will fail gracefully
// Use a unique storage key to prevent conflicts with multiple instances during hot reload
const storageKey = `sb-${supabaseUrl?.replace(/[^a-zA-Z0-9]/g, '-') || 'placeholder'}-auth-token`;

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storageKey: storageKey,
        autoRefreshToken: true,
        persistSession: true,
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storageKey: 'sb-placeholder-auth-token',
        autoRefreshToken: false,
        persistSession: false,
      }
    });

// Export configuration status for UI components
export const supabaseConfigStatus = {
  isConfigured: isSupabaseConfigured,
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey && !isPlaceholder(supabaseAnonKey),
};

