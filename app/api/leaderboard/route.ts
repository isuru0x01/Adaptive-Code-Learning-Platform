import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const language = searchParams.get('language');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query for leaderboard view
        let query = supabase
            .from('leaderboard_view')
            .select('*')
            .order('total_questions_correct', { ascending: false })
            .order('accuracy_percentage', { ascending: false })
            .limit(limit);

        // Filter by language if specified
        if (language) {
            query = query.eq('language', language);
        }

        const { data: leaderboard, error } = await query;

        if (error) throw error;

        // Add rankings
        const rankedLeaderboard = leaderboard?.map((entry, index) => ({
            rank: index + 1,
            ...entry,
        }));

        return NextResponse.json(rankedLeaderboard || []);

    } catch (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}

// Enable CORS for public access
export const runtime = 'edge';
