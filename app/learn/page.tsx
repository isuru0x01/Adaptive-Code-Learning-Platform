'use client';

import { useEffect, useState } from 'react';
import { useLearningStore } from '@/lib/stores/learning-store';
import CodeViewer from '@/components/code-viewer';
import QuestionPanel from '@/components/question-panel';
import FeedbackModal from '@/components/feedback-modal';
import Link from 'next/link';

export default function LearnPage() {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
    const { fetchNewQuestion, currentQuestion, isLoading } = useLearningStore();

    useEffect(() => {
        fetchNewQuestion(selectedLanguage);
    }, [selectedLanguage, fetchNewQuestion]);

    const languages = [
        { id: 'javascript', name: 'JavaScript', icon: '🟨' },
        { id: 'python', name: 'Python', icon: '🐍' },
        { id: 'typescript', name: 'TypeScript', icon: '🔷' },
        { id: 'java', name: 'Java', icon: '☕' },
        { id: 'go', name: 'Go', icon: '🔵' },
        { id: 'rust', name: 'Rust', icon: '🦀' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-3xl">🧠</span>
                        <span className="text-xl font-bold text-gray-900">Read The Code</span>
                    </Link>

                    {/* Language Selector */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">Language:</span>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-medium hover:border-gray-300 focus:outline-none focus:border-blue-600 transition"
                        >
                            {languages.map((lang) => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.icon} {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Link href="/" className="text-gray-600 hover:text-gray-900 transition font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-20 h-screen flex flex-col">
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Code Viewer */}
                    <div className="w-1/2 border-r border-gray-200 bg-white overflow-auto">
                        <div className="p-8">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Code Snippet</h2>
                                <p className="text-gray-600">Read and understand the code below</p>
                            </div>
                            <CodeViewer
                                code={currentQuestion?.codeSnippet || ''}
                                language={selectedLanguage}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>

                    {/* Right Panel - Question */}
                    <div className="w-1/2 bg-gray-50 overflow-auto">
                        <div className="p-8">
                            <QuestionPanel />
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Modal */}
            <FeedbackModal />
        </div>
    );
}
