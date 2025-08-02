// This file now exports the same database connection as supabase.ts
// to ensure consistency across the application
export { db, client as connection } from '../services/supabase';