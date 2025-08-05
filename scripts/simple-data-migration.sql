-- Simple Data Migration Script
-- Copy real development data to production Supabase

-- First, let's check what we have in the current database
SELECT 'Current Database Stats' as info;
SELECT 'Alerts' as table_name, COUNT(*) as record_count FROM alerts
UNION ALL  
SELECT 'Agents' as table_name, COUNT(*) as record_count FROM agents
UNION ALL
SELECT 'Activities' as table_name, COUNT(*) as record_count FROM activities
UNION ALL
SELECT 'Feedback' as table_name, COUNT(*) as record_count FROM feedback;

-- Show sample alert data to verify it's real
SELECT 'Sample Alert Data' as info;
SELECT id, title, category, priority, agent_id, created_at 
FROM alerts 
ORDER BY created_at DESC 
LIMIT 5;