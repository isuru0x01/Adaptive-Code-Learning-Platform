import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateQuestion } from '@/lib/openrouter/generation-service';
import { z } from 'zod';

const RequestSchema = z.object({
    language: z.enum(['javascript', 'python', 'java', 'typescript', 'go', 'rust']),
    sessionId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
    console.log('🔍 [GENERATE-QUESTION] Starting request...');

    try {
        const supabase = await createServerClient();
        console.log('✅ [GENERATE-QUESTION] Supabase client created');

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('❌ [GENERATE-QUESTION] Auth error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('✅ [GENERATE-QUESTION] User authenticated:', user.id);

        const userId = user.id;

        // Validate request body
        const body = await request.json();
        console.log('📦 [GENERATE-QUESTION] Request body:', body);

        const { language, sessionId } = RequestSchema.parse(body);
        console.log(`✅ [GENERATE-QUESTION] Validated - Language: ${language}, SessionID: ${sessionId || 'none'}`);

        // Get or create user skill level
        console.log('🔍 [GENERATE-QUESTION] Fetching user skill...');
        const { data: skillData, error: skillError } = await supabase.rpc(
            'get_or_create_user_skill',
            { p_user_id: userId, p_language: language }
        );

        if (skillError) {
            console.error('❌ [GENERATE-QUESTION] Skill fetch error:', skillError);
            throw skillError;
        }
        console.log('✅ [GENERATE-QUESTION] User skill data:', skillData);

        const currentDifficulty = skillData.current_difficulty_score;
        console.log(`📊 [GENERATE-QUESTION] Current difficulty: ${currentDifficulty}`);

        // Get recent attempts for context
        console.log('🔍 [GENERATE-QUESTION] Fetching recent attempts...');
        const { data: recentAttempts } = await supabase
            .from('user_progress')
            .select('question_id, is_correct, questions(concepts)')
            .eq('user_id', userId)
            .order('attempted_at', { ascending: false })
            .limit(5);

        console.log('✅ [GENERATE-QUESTION] Recent attempts:', recentAttempts?.length || 0);

        const previousConcepts = recentAttempts
            ?.flatMap((a: any) => a.questions?.concepts || [])
            .slice(0, 10) || [];

        const wasLastCorrect = recentAttempts?.[0]?.is_correct;
        console.log(`📈 [GENERATE-QUESTION] Previous concepts: ${previousConcepts.length}, Last correct: ${wasLastCorrect}`);

        // Generate question via LLM
        console.log('🤖 [GENERATE-QUESTION] Calling LLM to generate question...');
        const generatedQuestion = await generateQuestion({
            language,
            difficulty: currentDifficulty,
            previousConcepts,
            wasLastCorrect,
        });
        console.log('✅ [GENERATE-QUESTION] Question generated successfully');

        // Save question to database
        console.log('💾 [GENERATE-QUESTION] Saving question to database...');
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

        if (saveError) {
            console.error('❌ [GENERATE-QUESTION] Save error:', saveError);
            throw saveError;
        }
        console.log('✅ [GENERATE-QUESTION] Question saved with ID:', savedQuestion.id);

        // Update or create learning session
        if (sessionId) {
            console.log(`🔍 [GENERATE-QUESTION] Updating session: ${sessionId}`);
            const { data: currentSession, error: sessionFetchError } = await supabase
                .from('learning_sessions')
                .select('questions_attempted')
                .eq('id', sessionId)
                .single();

            if (sessionFetchError) {
                console.error('⚠️ [GENERATE-QUESTION] Session fetch error:', sessionFetchError);
            } else if (currentSession) {
                console.log(`📊 [GENERATE-QUESTION] Current questions_attempted: ${currentSession.questions_attempted}`);
                const { error: updateError } = await supabase
                    .from('learning_sessions')
                    .update({
                        questions_attempted: currentSession.questions_attempted + 1
                    })
                    .eq('id', sessionId);

                if (updateError) {
                    console.error('⚠️ [GENERATE-QUESTION] Session update error:', updateError);
                } else {
                    console.log('✅ [GENERATE-QUESTION] Session updated successfully');
                }
            } else {
                console.warn('⚠️ [GENERATE-QUESTION] Session not found:', sessionId);
            }
        }

        console.log('✅ [GENERATE-QUESTION] Request completed successfully');

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
        console.error('❌❌❌ [GENERATE-QUESTION] FATAL ERROR ❌❌❌');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Full error object:', JSON.stringify(error, null, 2));

        return NextResponse.json(
            {
                error: 'Failed to generate question',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
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
