
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const supabaseUrl = 'https://ahlejwbbzehvgmsddtdf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobGVqd2JiemVodmdtc2RkdGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDY1ODMsImV4cCI6MjA4NTcyMjU4M30.Ah2_Hm1QOuxwCqZ6R4N-TslezTi2S0S6rticSAdgHLE';

export const supabase = createClient(supabaseUrl, supabaseKey);
