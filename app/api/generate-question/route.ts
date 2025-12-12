import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateQuestion } from '@/lib/openrouter/generation-service';
import { z } from 'zod';

const RequestSchema = z.object({
    language: z.enum(['javascript', 'python', 'java', 'typescript', 'go', 'rust']),
    sessionId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // DEV MODE: Bypass auth for testing (REMOVE IN PRODUCTION!)
        const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
        let userId: string;

        if (DEV_MODE) {
            // Use a test user ID for development
            userId = '00000000-0000-0000-0000-000000000001';
            console.log('⚠️  DEV MODE: Using test user ID. Set NEXT_PUBLIC_DEV_MODE=false in production!');
        } else {
            // Verify authentication
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            userId = user.id;
        }

        // Validate request body
        const body = await request.json();
        const { language, sessionId } = RequestSchema.parse(body);

        // Get or create user skill level
        const { data: skillData, error: skillError } = await supabase.rpc(
            'get_or_create_user_skill',
            { p_user_id: userId, p_language: language }
        );

        if (skillError) throw skillError;

        const currentDifficulty = skillData.current_difficulty_score;

        // Get recent attempts for context
        const { data: recentAttempts } = await supabase
            .from('user_progress')
            .select('question_id, is_correct, questions(concepts)')
            .eq('user_id', userId)
            .order('attempted_at', { ascending: false })
            .limit(5);

        const previousConcepts = recentAttempts
            ?.flatMap((a: any) => a.questions?.concepts || [])
            .slice(0, 10) || [];

        const wasLastCorrect = recentAttempts?.[0]?.is_correct;

        // Generate question via LLM
        const generatedQuestion = await generateQuestion({
            language,
            difficulty: currentDifficulty,
            previousConcepts,
            wasLastCorrect,
        });

        // Save question to database
        const { data: savedQuestion, error: saveError } = await supabase
            .from('questions')
            .insert({
                code_snippet: generatedQuestion.code_snippet,
                question_text: generatedQuestion.question,
                correct_answer: generatedQuestion.correct_answer,
                difficulty: mapScoreToDifficulty(generatedQuestion.difficulty_score),
                language: language,
                concepts: generatedQuestion.concepts,
                difficulty_score: generatedQuestion.difficulty_score,
                created_by: userId,
            })
            .select()
            .single();

        if (saveError) throw saveError;

        // Update or create learning session
        if (sessionId) {
            await supabase
                .from('learning_sessions')
                .update({ questions_attempted: supabase.rpc('increment', { x: 1 }) })
                .eq('id', sessionId);
        }

        // Return question WITHOUT correct answer (security)
        return NextResponse.json({
            id: savedQuestion.id,
            codeSnippet: savedQuestion.code_snippet,
            question: savedQuestion.question_text,
            concepts: savedQuestion.concepts,
            difficulty: savedQuestion.difficulty,
            currentScore: currentDifficulty,
        });

    } catch (error) {
        console.error('Generate question error:', error);
        return NextResponse.json(
            { error: 'Failed to generate question' },
            { status: 500 }
        );
    }
}

function mapScoreToDifficulty(score: number): string {
    if (score <= 20) return 'beginner';
    if (score <= 40) return 'easy';
    if (score <= 60) return 'medium';
    if (score <= 80) return 'hard';
    return 'expert';
}
