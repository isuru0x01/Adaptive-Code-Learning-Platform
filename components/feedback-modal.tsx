'use client';

import { useLearningStore } from '@/lib/stores/learning-store';

export default function FeedbackModal() {
    const { feedback, clearFeedback, fetchNewQuestion, currentQuestion } = useLearningStore();

    if (!feedback) return null;

    const { isCorrect, feedback: message, hint, correctAnswer, explanation, newDifficultyScore } = feedback;

    const handleNext = () => {
        clearFeedback();
        if (currentQuestion?.language) {
            fetchNewQuestion(currentQuestion.language);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        {isCorrect ? (
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                                ✓
                            </div>
                        ) : (
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-3xl">
                                ✗
                            </div>
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                {isCorrect ? 'Correct!' : 'Not Quite'}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {isCorrect ? 'Great job! Keep it up.' : 'Let\'s review the answer'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* AI Feedback */}
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Feedback</p>
                        <p className="text-gray-700 leading-relaxed">{message}</p>
                    </div>

                    {/* Hint for incorrect answers */}
                    {!isCorrect && hint && (
                        <div className="p-5 rounded-xl bg-blue-50 border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Hint</p>
                            <p className="text-blue-800 leading-relaxed">{hint}</p>
                        </div>
                    )}

                    {/* Correct answer reveal */}
                    <div className="p-5 rounded-xl border-2 border-gray-200 bg-white">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Correct Answer</p>
                        <p className="font-mono text-lg bg-gray-100 px-4 py-3 rounded-lg text-gray-900 border border-gray-200">
                            {correctAnswer}
                        </p>
                    </div>

                    {/* Explanation */}
                    {explanation && (
                        <div className="p-5 rounded-xl bg-gray-50 border border-gray-200">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Explanation</p>
                            <p className="text-gray-700 leading-relaxed">{explanation}</p>
                        </div>
                    )}

                    {/* Difficulty change indicator */}
                    {newDifficultyScore && (
                        <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                            <p className="text-sm text-gray-700">
                                {isCorrect ? '📈 Difficulty increased' : '📉 Difficulty adjusted'} to{' '}
                                <span className="font-bold text-blue-600 text-lg">{newDifficultyScore}/100</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleNext}
                        className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-lg font-semibold shadow-lg shadow-gray-900/10"
                    >
                        Next Question →
                    </button>
                </div>
            </div>
        </div>
    );
}
