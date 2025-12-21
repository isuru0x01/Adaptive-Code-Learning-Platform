'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import AuthButton from '@/components/auth-button';

export function SiteHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'Learn', href: '/learn' },
        { name: 'Leaderboard', href: '/leaderboard' },
        { name: 'About', href: '/about' },
    ];

    return (
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 z-50 relative">
                        <span className="text-3xl">🧠</span>
                        <span className="text-xl font-bold text-gray-900">Read The Code</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex items-center gap-6">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="text-gray-600 hover:text-gray-900 transition font-medium text-sm"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                        <div className="pl-6 border-l border-gray-200">
                            <AuthButton />
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition z-50 relative"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-white z-40 pt-24 px-6 md:hidden animate-in fade-in slide-in-from-top-10 duration-200">
                    <nav className="flex flex-col gap-6 text-lg font-medium">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-gray-900 py-2 border-b border-gray-100"
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-4">
                            <AuthButton />
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
