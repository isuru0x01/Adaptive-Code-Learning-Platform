import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Question {
    id: string;
    codeSnippet: string;
    question: string;
    concepts: string[];
    difficulty: string;
    currentScore: number;
    language?: string;
}

interface Feedback {
    isCorrect: boolean;
    feedback: string;
    hint?: string;
    correctAnswer: string;
    explanation?: string;
    newDifficultyScore?: number;
}

interface LearningStore {
    currentQuestion: Question | null;
    feedback: Feedback | null;
    isLoading: boolean;
    sessionId: string | null;

    fetchNewQuestion: (language: string) => Promise<void>;
    submitAnswer: (answer: string) => Promise<void>;
    clearFeedback: () => void;
    startSession: (language: string) => Promise<void>;
    endSession: () => Promise<void>;
}

export const useLearningStore = create<LearningStore>()(
    devtools(
        (set, get) => ({
            currentQuestion: null,
            feedback: null,
            isLoading: false,
            sessionId: null,

            fetchNewQuestion: async (language: string) => {
                set({ isLoading: true, feedback: null });

                try {
                    const response = await fetch('/api/generate-question', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            language,
                            sessionId: get().sessionId,
                        }),
                    });

                    if (!response.ok) throw new Error('Failed to generate question');

                    const data = await response.json();
                    // Add language to the question data
                    set({ currentQuestion: { ...data, language }, isLoading: false });
                } catch (error) {
                    console.error(error);
                    set({ isLoading: false });
                }
            },

            submitAnswer: async (answer: string) => {
                const question = get().currentQuestion;
                if (!question) return;

                set({ isLoading: true });

                try {
                    const response = await fetch('/api/check-answer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            questionId: question.id,
                            userAnswer: answer,
                            sessionId: get().sessionId,
                        }),
                    });

                    if (!response.ok) throw new Error('Failed to check answer');

                    const data = await response.json();
                    set({ feedback: data, isLoading: false });
                } catch (error) {
                    console.error(error);
                    set({ isLoading: false });
                }
            },

            clearFeedback: () => set({ feedback: null }),

            startSession: async (language: string) => {
                // Create new session in DB
                console.log('🎬 [SESSION] Starting new session for language:', language);
                try {
                    const response = await fetch('/api/sessions/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ language }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        console.error('❌ [SESSION] Failed to start session:', error);
                        throw new Error('Failed to start session');
                    }

                    const { sessionId } = await response.json();
                    console.log('✅ [SESSION] Session started successfully:', sessionId);
                    set({ sessionId });
                } catch (error) {
                    console.error('❌ [SESSION] Start session error:', error);
                }
            },

            endSession: async () => {
                const sessionId = get().sessionId;
                if (!sessionId) {
                    console.warn('⚠️ [SESSION] No active session to end');
                    return;
                }

                console.log('🛑 [SESSION] Ending session:', sessionId);
                try {
                    const response = await fetch(`/api/sessions/${sessionId}/end`, {
                        method: 'POST'
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        console.error('❌ [SESSION] Failed to end session:', error);
                    } else {
                        console.log('✅ [SESSION] Session ended successfully');
                    }

                    set({ sessionId: null });
                } catch (error) {
                    console.error('❌ [SESSION] End session error:', error);
                }
            },
        }),
        { name: 'learning-store' }
    )
);
