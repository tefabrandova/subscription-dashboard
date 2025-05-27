import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://hohsvrzyoluzhtsbifyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaHN2cnp5b2x1emh0c2JpZnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNzUyNTcsImV4cCI6MjA2Mzg1MTI1N30.Qv_HcZWMaVprc4XHWRMSdCaFXvaRCC2ntY0tK_uVtl0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);