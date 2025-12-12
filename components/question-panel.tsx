'use client';

import { useState, useEffect, useRef } from 'react';

interface QuestionPanelProps {
    question: any;
    isLoading: boolean;
    onSubmit: (answer: string) => void;
    onNextQuestion: () => void;
}

export default function QuestionPanel({
    question,
    isLoading,
    onSubmit,
    onNextQuestion,
}: QuestionPanelProps) {
    const [answer, setAnswer] = useState('');
    const [startTime, setStartTime] = useState<number>(Date.now());
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Reset state when new question loads
    useEffect(() => {
        if (question) {
            setAnswer('');
            setStartTime(Date.now());
            // Auto-focus answer input (UX improvement)
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [question?.id]);

    const handleSubmit = () => {
        if (!answer.trim()) return;

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        onSubmit(answer);
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="h-10 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
        );
    }

    if (!question) {
        return (
            <div className="flex items-center justify-center h-full">
                <button
                    onClick={onNextQuestion}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Start Learning
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6">
            {/* Difficulty indicator */}
            <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
          ${question.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'easy' ? 'bg-blue-100 text-blue-800' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                question.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'}`}>
                    {question.difficulty} · Score: {question.currentScore}/100
                </span>
            </div>

            {/* Question text */}
            <div className="border rounded-lg p-6 mb-6 bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Question</h2>
                <p className="text-lg leading-relaxed">{question.question}</p>

                {/* Concepts tags (helps learner understand what's being tested) */}
                {question.concepts && question.concepts.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {question.concepts.map((concept: string, idx: number) => (
                            <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                                {concept}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Answer input */}
            <div className="flex-1 flex flex-col">
                <label htmlFor="answer" className="text-sm font-medium mb-2">
                    Your Answer
                </label>
                <textarea
                    ref={textareaRef}
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 resize-none font-mono border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                        // Submit on Cmd+Enter or Ctrl+Enter (UX shortcut)
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                <p className="text-xs text-gray-500 mt-2">
                    Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
                </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!answer.trim()}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                    Submit Answer
                </button>
                <button
                    onClick={onNextQuestion}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}
