'use client';

import { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/stores/learning-store';
import CodeViewer from '@/components/code-viewer';
import QuestionPanel from '@/components/question-panel';
import FeedbackModal from '@/components/feedback-modal';
import ProgressIndicator from '@/components/progress-indicator';

export default function LearnPage() {
    const {
        currentQuestion,
        isLoading,
        feedback,
        fetchNewQuestion,
        submitAnswer,
        clearFeedback,
    } = useLearningStore();

    const [selectedLanguage, setSelectedLanguage] = useState('javascript');

    useEffect(() => {
        // Load first question on mount
        if (!currentQuestion) {
            fetchNewQuestion(selectedLanguage);
        }
    }, []);

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="border-b bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Code Learning Lab</h1>
                    <div className="flex items-center gap-4">
                        {/* Language selector */}
                        <select
                            value={selectedLanguage}
                            onChange={(e) => {
                                setSelectedLanguage(e.target.value);
                                fetchNewQuestion(e.target.value);
                            }}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="typescript">TypeScript</option>
                            <option value="java">Java</option>
                            <option value="go">Go</option>
                            <option value="rust">Rust</option>
                        </select>
                        <ProgressIndicator />
                    </div>
                </div>
            </header>

            {/* Main split-screen layout */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Code Viewer */}
                <div className="w-1/2 border-r overflow-auto">
                    <CodeViewer
                        code={currentQuestion?.codeSnippet}
                        language={selectedLanguage}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right: Question Panel */}
                <div className="w-1/2 overflow-auto">
                    <QuestionPanel
                        question={currentQuestion}
                        isLoading={isLoading}
                        onSubmit={submitAnswer}
                        onNextQuestion={() => fetchNewQuestion(selectedLanguage)}
                    />
                </div>
            </main>

            {/* Feedback Modal */}
            {feedback && (
                <FeedbackModal
                    feedback={feedback}
                    onClose={clearFeedback}
                    onNext={() => {
                        clearFeedback();
                        fetchNewQuestion(selectedLanguage);
                    }}
                />
            )}
        </div>
    );
}
