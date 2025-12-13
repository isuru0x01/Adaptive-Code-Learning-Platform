import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Protected routes
    if (request.nextUrl.pathname.startsWith('/learn')) {
        const { data: { user } } = await supabase.auth.getUser();

        // Redirect to login if not authenticated
        if (!user) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    // Auth routes (redirect to learn if already logged in)
    if (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            return NextResponse.redirect(new URL('/learn', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ['/learn/:path*', '/auth/login', '/auth/signup'],
};
