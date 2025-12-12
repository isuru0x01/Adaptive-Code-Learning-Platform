'use client';

import { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '@/lib/stores/learning-store';

export default function QuestionPanel() {
    const {
        currentQuestion,
        isLoading,
        submitAnswer,
        fetchNewQuestion,
    } = useLearningStore();

    const [answer, setAnswer] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Reset state when new question loads
    useEffect(() => {
        if (currentQuestion) {
            setAnswer('');
            // Auto-focus answer input
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [currentQuestion?.id]);

    const handleSubmit = () => {
        if (!answer.trim() || !currentQuestion) return;
        submitAnswer(answer);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-3/4 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-32 w-full bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-12 w-full bg-gray-200 animate-pulse rounded-lg" />
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No question loaded</p>
                    <button
                        onClick={() => fetchNewQuestion('javascript')}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                    >
                        Load Question
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Difficulty indicator */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${currentQuestion.difficulty === 'beginner'
                                ? 'bg-green-100 text-green-700'
                                : currentQuestion.difficulty === 'easy'
                                    ? 'bg-blue-100 text-blue-700'
                                    : currentQuestion.difficulty === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : currentQuestion.difficulty === 'hard'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-red-100 text-red-700'
                            }`}
                    >
                        {currentQuestion.difficulty?.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600 font-medium">
                        Score: {currentQuestion.currentScore}/100
                    </span>
                </div>
            </div>

            {/* Question text */}
            <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-white shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Question</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                    {currentQuestion.question}
                </p>

                {/* Concepts tags */}
                {currentQuestion.concepts && currentQuestion.concepts.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {currentQuestion.concepts.map((concept: string, idx: number) => (
                            <span
                                key={idx}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg font-medium"
                            >
                                {concept}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Answer input */}
            <div className="flex-1 flex flex-col">
                <label htmlFor="answer" className="text-sm font-semibold text-gray-900 mb-2">
                    Your Answer
                </label>
                <textarea
                    ref={textareaRef}
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 resize-none font-mono border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:border-blue-600 transition bg-white text-gray-900"
                    onKeyDown={(e) => {
                        // Submit on Cmd+Enter or Ctrl+Enter
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                <p className="text-xs text-gray-500 mt-2">
                    Press <kbd className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">⌘+Enter</kbd> or <kbd className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">Ctrl+Enter</kbd> to submit
                </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!answer.trim()}
                    className="flex-1 px-6 py-3.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold shadow-sm"
                >
                    Submit Answer
                </button>
                <button
                    onClick={() => fetchNewQuestion(currentQuestion.language || 'javascript')}
                    className="px-6 py-3.5 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}
