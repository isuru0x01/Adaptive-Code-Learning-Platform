import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: sessionId } = await params;
    console.log('🛑 [API/SESSIONS/END] Request to end session:', sessionId);

    try {
        const supabase = await createServerClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('❌ [API/SESSIONS/END] Auth error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
        console.log('✅ [API/SESSIONS/END] User authenticated:', userId);

        // Verify session ownership and update
        const { data: session, error: sessionError } = await supabase
            .from('learning_sessions')
            .update({
                ended_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .eq('user_id', userId) // Ensure user owns this session
            .select()
            .single();

        if (sessionError) {
            console.error('❌ [API/SESSIONS/END] Database error:', sessionError);
            return NextResponse.json(
                { error: 'Session not found or access denied', details: sessionError.message },
                { status: 404 }
            );
        }

        console.log('✅ [API/SESSIONS/END] Session ended successfully');
        console.log('📊 [API/SESSIONS/END] Final stats:', {
            questions_attempted: session.questions_attempted,
            questions_correct: session.questions_correct,
            duration: new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
        });

        return NextResponse.json({ success: true, session });

    } catch (error) {
        console.error('❌ [API/SESSIONS/END] Fatal error:', error);
        return NextResponse.json(
            { error: 'Failed to end session', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
