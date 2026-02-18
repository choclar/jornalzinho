
import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são injetadas automaticamente pelo sistema
const supabaseUrl = (window as any).env?.SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = (window as any).env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found. Auth and DB features will be limited.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
