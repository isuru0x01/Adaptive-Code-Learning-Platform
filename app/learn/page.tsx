'use client';

import { useEffect, useState } from 'react';
import { useLearningStore } from '@/lib/stores/learning-store';
import CodeViewer from '@/components/code-viewer';
import QuestionPanel from '@/components/question-panel';
import FeedbackModal from '@/components/feedback-modal';
import AuthButton from '@/components/auth-button';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function LearnPage() {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
    const { fetchNewQuestion, currentQuestion, isLoading, startSession, endSession } = useLearningStore();

    // Start session when component mounts or language changes
    useEffect(() => {
        const initializeSession = async () => {
            await startSession(selectedLanguage);
            await fetchNewQuestion(selectedLanguage);
        };

        initializeSession();

        // End session when component unmounts
        return () => {
            endSession();
        };
    }, [selectedLanguage, startSession, fetchNewQuestion, endSession]);

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
            {/* Navigation */}
            <SiteHeader />

            {/* Main Content */}
            <div className="pt-20 h-screen flex flex-col">
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Panel - Code Viewer */}
                    <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-gray-200 bg-white overflow-auto flex-shrink-0">
                        <div className="p-4 md:p-8">
                            <div className="mb-4 md:mb-6">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">Code Snippet</h2>
                                <p className="text-sm md:text-base text-gray-600">Read and understand the code below</p>
                            </div>
                            <CodeViewer
                                code={currentQuestion?.codeSnippet || ''}
                                language={selectedLanguage}
                                isLoading={isLoading}
                                languages={languages}
                                onLanguageChange={setSelectedLanguage}
                            />
                        </div>
                    </div>

                    {/* Right Panel - Question */}
                    <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-gray-50 overflow-auto flex-shrink-0">
                        <div className="p-4 md:p-8">
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
