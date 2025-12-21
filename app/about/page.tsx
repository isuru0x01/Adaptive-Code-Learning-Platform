'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            {/* Navigation */}
            <SiteHeader />

            {/* Content */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-xl">
                        <h1 className="text-5xl font-bold text-gray-900 mb-8">About Read The Code</h1>

                        <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                            <p>
                                Read The Code is an adaptive code learning platform that uses artificial intelligence to help developers improve their programming skills through targeted code comprehension questions.
                            </p>

                            <h2 className="text-3xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
                            <p>
                                We believe that the best way to learn programming is through active practice and immediate feedback. Our platform adapts to your skill level, ensuring you're always challenged but never overwhelmed.
                            </p>

                            <h2 className="text-3xl font-bold text-gray-900 mt-8 mb-4">How It Works</h2>
                            <p>
                                Our AI-powered system generates unique code comprehension questions tailored to your current skill level. As you answer questions correctly, the difficulty increases. If you struggle, the system adjusts to help you build confidence.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-2xl">🎯</span>
                                        <span><strong className="text-gray-900">Adaptive Difficulty:</strong> Questions automatically adjust to your skill level (1-100 scale)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-2xl">🤖</span>
                                        <span><strong className="text-gray-900">AI-Generated Content:</strong> Unique questions powered by advanced language models</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-2xl">📊</span>
                                        <span><strong className="text-gray-900">Progress Tracking:</strong> Monitor your improvement with detailed analytics</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-2xl">🌍</span>
                                        <span><strong className="text-gray-900">6 Languages:</strong> JavaScript, Python, TypeScript, Java, Go, and Rust</span>
                                    </li>
                                </ul>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 mt-8 mb-4">Technology Stack</h2>
                            <p>
                                Built with Next.js 14, Supabase, and OpenRouter AI, Read The Code combines modern web technologies with cutting-edge artificial intelligence to deliver a seamless learning experience.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
