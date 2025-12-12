import { createClient } from '@supabase/supabase-js';

export const createServerClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            `Missing Supabase credentials. Please check your .env.local file:\n` +
            `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}\n` +
            `SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Set' : 'Missing'}`
        );
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
};
