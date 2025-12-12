'use client';

interface FeedbackModalProps {
    feedback: {
        isCorrect: boolean;
        feedback: string;
        hint?: string;
        correctAnswer: string;
        explanation?: string;
        newDifficultyScore?: number;
    };
    onClose: () => void;
    onNext: () => void;
}

export default function FeedbackModal({ feedback, onClose, onNext }: FeedbackModalProps) {
    const { isCorrect, feedback: message, hint, correctAnswer, explanation, newDifficultyScore } = feedback;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        {isCorrect ? (
                            <div className="text-green-600 text-3xl">✓</div>
                        ) : (
                            <div className="text-red-600 text-3xl">✗</div>
                        )}
                        <h2 className="text-2xl font-bold">
                            {isCorrect ? '🎉 Correct!' : '❌ Not Quite'}
                        </h2>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* AI Feedback */}
                    <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium mb-2">Feedback</p>
                        <p className="leading-relaxed">{message}</p>
                    </div>

                    {/* Hint for incorrect answers */}
                    {!isCorrect && hint && (
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="text-sm font-medium mb-2 text-blue-900">💡 Hint</p>
                            <p className="text-blue-800">{hint}</p>
                        </div>
                    )}

                    {/* Correct answer reveal */}
                    <div className="p-4 rounded-lg border">
                        <p className="text-sm font-medium mb-2">Correct Answer</p>
                        <p className="font-mono text-lg bg-gray-100 px-3 py-2 rounded">
                            {correctAnswer}
                        </p>
                    </div>

                    {/* Explanation */}
                    {explanation && (
                        <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm font-medium mb-2">Explanation</p>
                            <p className="leading-relaxed">{explanation}</p>
                        </div>
                    )}

                    {/* Difficulty change indicator */}
                    {newDifficultyScore && (
                        <div className="text-center py-2">
                            <p className="text-sm text-gray-600">
                                {isCorrect ? '📈 Difficulty increased' : '📉 Difficulty adjusted'} to{' '}
                                <span className="font-bold">{newDifficultyScore}/100</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t">
                    <button
                        onClick={onNext}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-medium"
                    >
                        Next Question →
                    </button>
                </div>
            </div>
        </div>
    );
}
