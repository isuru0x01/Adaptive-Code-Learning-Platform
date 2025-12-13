import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkAnswer } from '@/lib/openrouter/generation-service';
import { z } from 'zod';

const RequestSchema = z.object({
    questionId: z.string().uuid(),
    userAnswer: z.string().min(1),
    timeSpentSeconds: z.number().int().min(0).nullable().optional(),
    sessionId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        const body = await request.json();
        const { questionId, userAnswer, timeSpentSeconds, sessionId } = RequestSchema.parse(body);

        // Fetch question with correct answer
        const { data: question, error: questionError } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();

        if (questionError || !question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        // Use LLM to check answer (fuzzy matching)
        const answerCheck = await checkAnswer(
            question.question_text,
            question.correct_answer,
            userAnswer
        );

        // Save user progress
        const { error: progressError } = await supabase
            .from('user_progress')
            .insert({
                user_id: userId,
                question_id: questionId,
                user_answer: userAnswer,
                is_correct: answerCheck.is_correct,
                time_spent_seconds: timeSpentSeconds,
            });

        if (progressError) throw progressError;

        // Update user difficulty level
        const { data: newDifficulty } = await supabase.rpc('update_user_difficulty', {
            p_user_id: userId,
            p_language: question.language,
            p_is_correct: answerCheck.is_correct,
            p_question_difficulty: question.difficulty_score,
        });

        // Update session stats
        if (sessionId) {
            await supabase.from('learning_sessions').update({
                questions_correct: answerCheck.is_correct
                    ? supabase.rpc('increment', { x: 1 })
                    : undefined,
            }).eq('id', sessionId);
        }

        return NextResponse.json({
            isCorrect: answerCheck.is_correct,
            feedback: answerCheck.feedback,
            hint: answerCheck.hint,
            correctAnswer: question.correct_answer,
            explanation: question.explanation || 'No explanation available',
            newDifficultyScore: newDifficulty,
        });

    } catch (error) {
        console.error('Check answer error:', error);
        return NextResponse.json(
            { error: 'Failed to check answer' },
            { status: 500 }
        );
    }
}
