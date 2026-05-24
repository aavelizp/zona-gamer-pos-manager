import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://timodswfbslxzgzsycwp.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbW9kc3dmYnNseHpnenN5Y3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NzIwNzksImV4cCI6MjA5NDU0ODA3OX0.0USxNfTd8Tms9SU72kkJWEXnL6N3MxFW7iXcsLMwJDQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);