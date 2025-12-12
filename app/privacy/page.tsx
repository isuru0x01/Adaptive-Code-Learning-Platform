'use client';

import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-3xl">🧠</span>
                        <span className="text-xl font-bold text-gray-900">Read The Code</span>
                    </Link>
                    <Link href="/" className="text-gray-600 hover:text-gray-900 transition font-medium">
                        Back to Home
                    </Link>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-xl">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                        <p className="text-gray-500 mb-8">Last updated: December 12, 2024</p>

                        <div className="space-y-8 text-gray-600 leading-relaxed">
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                                <p className="mb-4">
                                    We collect information that you provide directly to us, including:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Account information (email, username)</li>
                                    <li>Learning progress and performance data</li>
                                    <li>Question responses and answer submissions</li>
                                    <li>Usage statistics and interaction patterns</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                                <p className="mb-4">
                                    We use the information we collect to:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Provide, maintain, and improve our services</li>
                                    <li>Personalize your learning experience</li>
                                    <li>Track your progress and adapt difficulty levels</li>
                                    <li>Send you technical notices and support messages</li>
                                    <li>Analyze usage patterns to improve our platform</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Storage and Security</h2>
                                <p>
                                    Your data is stored securely using Supabase, a PostgreSQL-based platform with enterprise-grade security. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Services</h2>
                                <p className="mb-4">
                                    We use the following third-party services:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong className="text-gray-900">Supabase:</strong> Database and authentication</li>
                                    <li><strong className="text-gray-900">OpenRouter:</strong> AI-powered question generation (anonymized data)</li>
                                    <li><strong className="text-gray-900">Vercel/Netlify:</strong> Hosting and deployment</li>
                                </ul>
                                <p className="mt-4">
                                    These services have their own privacy policies governing the use of your information.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
                                <p className="mb-4">
                                    You have the right to:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Access your personal data</li>
                                    <li>Correct inaccurate data</li>
                                    <li>Request deletion of your data</li>
                                    <li>Export your learning progress</li>
                                    <li>Opt-out of communications</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
                                <p>
                                    We use essential cookies to maintain your session and preferences. We do not use third-party advertising cookies or tracking pixels.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
                                <p>
                                    Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
                                <p>
                                    We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                                <p>
                                    If you have any questions about this Privacy Policy, please contact us through our GitHub repository or support channels.
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200">
                            <Link href="/" className="text-blue-600 hover:text-blue-700 transition font-medium">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
