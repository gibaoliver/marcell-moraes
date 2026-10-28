// scripts/supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ddrjurekpkaqkxslpcar.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1rX1SaKakGPGxg2Uf5qpBA_nOKxGB6H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

