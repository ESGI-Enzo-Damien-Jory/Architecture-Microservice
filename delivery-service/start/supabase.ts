import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const supabaseUrl = process.env.DB_URL
const supabaseServiceKey = process.env.JWT_SECRET

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL or Service Role Key environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
