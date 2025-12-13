import { createServerClient as createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        const supabase = await createClient();

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Auth callback error:', error);
            // Redirect to login with error
            return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Redirect to learn page after successful authentication
    return NextResponse.redirect(`${origin}/learn`);
}
