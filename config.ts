import 'dotenv/config';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!googleApiKey) {
  throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable');
}

export const google = createGoogleGenerativeAI({ apiKey: googleApiKey });

const supabasePrivateKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabasePrivateKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing or invalid');

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is missing or invalid');

export const supabase = createClient(supabaseUrl, supabasePrivateKey);
