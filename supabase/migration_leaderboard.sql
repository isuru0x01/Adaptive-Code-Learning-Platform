-- Migration: Add Leaderboard View and Public Access Policies
-- Run this in your Supabase SQL Editor

-- 1. Add public read policy for completed sessions
CREATE POLICY IF NOT EXISTS "Public can view completed sessions for leaderboard" 
ON learning_sessions FOR SELECT 
TO anon, authenticated
USING (ended_at IS NOT NULL);

-- 2. Create leaderboard view with display names from auth
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
    ls.user_id,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name', 
        au.email
    ) as display_name,
    ls.language,
    COUNT(ls.id) as total_sessions,
    SUM(ls.questions_attempted) as total_questions_attempted,
    SUM(ls.questions_correct) as total_questions_correct,
    CASE 
        WHEN SUM(ls.questions_attempted) > 0 
        THEN ROUND((SUM(ls.questions_correct)::numeric / SUM(ls.questions_attempted)::numeric) * 100, 2)
        ELSE 0 
    END as accuracy_percentage,
    MAX(ls.ended_at) as last_active
FROM learning_sessions ls
LEFT JOIN auth.users au ON au.id = ls.user_id
WHERE ls.ended_at IS NOT NULL
GROUP BY ls.user_id, au.raw_user_meta_data, au.email, ls.language;

-- 3. Grant public access to the view
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;

-- Migration complete!
-- You should now be able to access /api/leaderboard
