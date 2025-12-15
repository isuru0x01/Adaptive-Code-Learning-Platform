'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthButton from '@/components/auth-button';

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    display_name: string | null;
    language: string;
    total_sessions: number;
    total_questions_attempted: number;
    total_questions_correct: number;
    accuracy_percentage: number;
    last_active: string;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    const languages = [
        { id: 'all', name: 'All Languages', icon: '🌐' },
        { id: 'javascript', name: 'JavaScript', icon: '🟨' },
        { id: 'python', name: 'Python', icon: '🐍' },
        { id: 'typescript', name: 'TypeScript', icon: '🔷' },
        { id: 'java', name: 'Java', icon: '☕' },
        { id: 'go', name: 'Go', icon: '🔵' },
        { id: 'rust', name: 'Rust', icon: '🦀' },
    ];

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedLanguage !== 'all') {
                    params.set('language', selectedLanguage);
                }
                params.set('limit', '50');

                const response = await fetch(`/api/leaderboard?${params}`);
                const data = await response.json();

                // Ensure data is an array to prevent .map errors
                if (Array.isArray(data)) {
                    setLeaderboard(data);
                } else {
                    console.error('Leaderboard API returned non-array data:', data);
                    setLeaderboard([]);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
                setLeaderboard([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [selectedLanguage]);

    const getMedalEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return null;
    };

    const getLanguageIcon = (lang: string) => {
        const language = languages.find(l => l.id === lang);
        return language?.icon || '💻';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                        <span className="text-3xl">🧠</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Read The Code
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/learn"
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition transform hover:scale-105"
                        >
                            Start Learning
                        </Link>
                        <AuthButton />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            🏆 Leaderboard
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Top performers in code comprehension challenges. Can you make it to the top?
                        </p>
                    </div>

                    {/* Language Filter */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-3 bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
                            <span className="text-sm font-semibold text-gray-700 pl-3">Filter:</span>
                            {languages.map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => setSelectedLanguage(lang.id)}
                                    className={`px-4 py-2 rounded-xl font-medium transition transform hover:scale-105 ${selectedLanguage === lang.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="mr-2">{lang.icon}</span>
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {!isLoading && leaderboard.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">👥</span>
                                    <h3 className="text-lg font-semibold text-gray-700">Total Players</h3>
                                </div>
                                <p className="text-4xl font-bold text-indigo-600">{leaderboard.length}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">❓</span>
                                    <h3 className="text-lg font-semibold text-gray-700">Questions Solved</h3>
                                </div>
                                <p className="text-4xl font-bold text-purple-600">
                                    {leaderboard.reduce((sum, entry) => sum + entry.total_questions_correct, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">🎯</span>
                                    <h3 className="text-lg font-semibold text-gray-700">Avg. Accuracy</h3>
                                </div>
                                <p className="text-4xl font-bold text-pink-600">
                                    {(leaderboard.reduce((sum, entry) => sum + entry.accuracy_percentage, 0) / leaderboard.length).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Table */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                                <p className="mt-4 text-gray-600 font-medium">Loading leaderboard...</p>
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="text-6xl mb-4 block">🎯</span>
                                <p className="text-xl text-gray-600 font-medium">No data yet. Be the first to start learning!</p>
                                <Link
                                    href="/learn"
                                    className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition transform hover:scale-105"
                                >
                                    Start Now
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Rank</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Player</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Language</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Questions</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Correct</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Accuracy</th>
                                            <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">Sessions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {leaderboard.map((entry) => {
                                            const medal = getMedalEmoji(entry.rank);
                                            return (
                                                <tr
                                                    key={`${entry.user_id}-${entry.language}`}
                                                    className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                                                        }`}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {medal && <span className="text-2xl">{medal}</span>}
                                                            <span className="text-lg font-bold text-gray-900">#{entry.rank}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                                {entry.display_name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <span className="font-semibold text-gray-900">
                                                                {entry.display_name || 'Anonymous User'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800">
                                                            <span>{getLanguageIcon(entry.language)}</span>
                                                            <span className="capitalize">{entry.language}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-medium">
                                                        {entry.total_questions_attempted.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-bold">
                                                        {entry.total_questions_correct.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${entry.accuracy_percentage >= 80 ? 'bg-green-100 text-green-800' :
                                                            entry.accuracy_percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {entry.accuracy_percentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 font-medium">
                                                        {entry.total_sessions}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Call to Action */}
                    {!isLoading && leaderboard.length > 0 && (
                        <div className="mt-12 text-center">
                            <div className="inline-block bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    Ready to compete? 🚀
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Start practicing and climb the leaderboard!
                                </p>
                                <Link
                                    href="/learn"
                                    className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
                                >
                                    Start Learning Now
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
