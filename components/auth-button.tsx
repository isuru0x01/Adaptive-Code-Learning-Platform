'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center gap-3">
                <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-900 transition font-medium"
                >
                    Sign in
                </Link>
                <Link
                    href="/auth/signup"
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition shadow-sm"
                >
                    Get Started
                </Link>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900 hidden md:block">
                    {user.email}
                </span>
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">Signed in as</p>
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                        <Link
                            href="/learn"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowMenu(false)}
                        >
                            Learning Dashboard
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            Sign out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
