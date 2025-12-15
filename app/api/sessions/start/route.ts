import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const RequestSchema = z.object({
    language: z.enum(['javascript', 'python', 'java', 'typescript', 'go', 'rust']),
});

export async function POST(request: NextRequest) {
    console.log('🎬 [API/SESSIONS/START] Request received');

    try {
        const supabase = await createServerClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('❌ [API/SESSIONS/START] Auth error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
        console.log('✅ [API/SESSIONS/START] User authenticated:', userId);

        // Validate request body
        const body = await request.json();
        const { language } = RequestSchema.parse(body);
        console.log('📝 [API/SESSIONS/START] Creating session for language:', language);

        // Create new session
        const { data: session, error: sessionError } = await supabase
            .from('learning_sessions')
            .insert({
                user_id: userId,
                language: language,
                started_at: new Date().toISOString(),
                questions_attempted: 0,
                questions_correct: 0,
            })
            .select()
            .single();

        if (sessionError) {
            console.error('❌ [API/SESSIONS/START] Database error:', sessionError);
            throw sessionError;
        }

        console.log('✅ [API/SESSIONS/START] Session created:', session.id);
        return NextResponse.json({ sessionId: session.id });

    } catch (error) {
        console.error('❌ [API/SESSIONS/START] Fatal error:', error);
        return NextResponse.json(
            { error: 'Failed to start session', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
