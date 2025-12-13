import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Only protect /learn route, don't redirect from auth pages
    if (!request.nextUrl.pathname.startsWith('/learn')) {
        return NextResponse.next();
    }

    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Redirect to login if not authenticated
    if (!session) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/learn/:path*'],
};
