export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
export type ProgrammingLanguage = 'javascript' | 'python' | 'java' | 'typescript' | 'go' | 'rust';

export interface Question {
    id: string;
    code_snippet: string;
    question_text: string;
    correct_answer: string;
    difficulty: DifficultyLevel;
    language: ProgrammingLanguage;
    concepts: string[];
    difficulty_score: number;
    created_at: string;
    created_by?: string;
}

export interface UserProgress {
    id: string;
    user_id: string;
    question_id: string;
    user_answer: string;
    is_correct: boolean;
    time_spent_seconds?: number;
    hints_used: number;
    attempted_at: string;
}

export interface UserSkill {
    id: string;
    user_id: string;
    language: ProgrammingLanguage;
    current_difficulty_score: number;
    total_questions_attempted: number;
    correct_answers: number;
    current_streak: number;
    best_streak: number;
    last_practiced_at?: string;
    updated_at: string;
}

export interface LearningSession {
    id: string;
    user_id: string;
    language: ProgrammingLanguage;
    started_at: string;
    ended_at?: string;
    questions_attempted: number;
    questions_correct: number;
}
