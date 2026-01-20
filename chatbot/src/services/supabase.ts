import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if valid (must handle placeholder text in .env which is not a valid URL)
const isValidUrl = envUrl && envUrl.startsWith('http') && !envUrl.includes('YOUR_SUPABASE_URL');
const isValidKey = envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY';

export const isDemoMode = !isValidUrl || !isValidKey;

// Use real credentials if valid, otherwise use safe placeholders to prevent createClient crash
const clientUrl = isValidUrl ? envUrl : 'https://placeholder.supabase.co';
const clientKey = isValidKey ? envKey : 'placeholder-key';

export const supabase = createClient(clientUrl, clientKey);

console.log(isDemoMode ? '🎮 Running in Demo Mode' : '🔗 Connected to Supabase');
