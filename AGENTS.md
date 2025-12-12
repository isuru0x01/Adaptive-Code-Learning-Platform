# Adaptive Code Learning Platform - Development Guide

## Project Overview

**Vision**: A Next.js web application that teaches programming through adaptive difficulty code comprehension questions.

**Core Mechanics**:
- Split-screen interface: code snippet (left) + question (right)
- OpenRouter LLM generates content dynamically
- Supabase stores user progress and content
- Difficulty adapts based on user performance (correct = harder, incorrect = easier)

**Tech Stack**:
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth)
- OpenRouter API
- Tailwind CSS
- Radix UI / shadcn/ui components

---

## Phase 1: Project Foundation & Architecture

### Step 1.1: Initialize Next.js Project

```bash
npx create-next-app@latest code-explainer --typescript --tailwind --app
cd code-explainer
```

**Configuration decisions**:
- ✅ TypeScript (type safety for complex state management)
- ✅ App Router (server components for performance)
- ✅ Tailwind CSS (rapid UI development)
- ✅ ESLint (code quality)
- ❌ src/ directory (keep root clean)

### Step 1.2: Install Core Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install openai axios
npm install @radix-ui/react-* # or: npx shadcn-ui@latest init
npm install react-syntax-highlighter @types/react-syntax-highlighter
npm install zustand # for client state management
npm install zod # for runtime validation
```

### Step 1.3: Environment Setup

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security consideration**: Service role key should NEVER be exposed to client. Only use in server actions/API routes.

### Step 1.4: Project Structure

```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (dashboard)/
│   ├── learn/
│   │   └── page.tsx          # Main learning interface
│   ├── progress/
│   │   └── page.tsx          # User progress dashboard
│   └── layout.tsx            # Authenticated layout
├── api/
│   ├── generate-question/
│   │   └── route.ts          # LLM generation endpoint
│   ├── check-answer/
│   │   └── route.ts          # Answer validation
│   └── save-progress/
│       └── route.ts          # Progress persistence
├── layout.tsx
└── page.tsx                   # Landing page

lib/
├── supabase/
│   ├── client.ts              # Browser client
│   ├── server.ts              # Server client
│   └── middleware.ts          # Auth middleware
├── openrouter/
│   ├── client.ts              # OpenRouter wrapper
│   └── prompts.ts             # Prompt templates
├── types/
│   └── index.ts               # Shared TypeScript types
├── utils/
│   ├── difficulty.ts          # Difficulty algorithm
│   └── validation.ts          # Zod schemas
└── stores/
    └── learning-store.ts      # Zustand state

components/
├── ui/                        # shadcn components
├── code-viewer.tsx
├── question-panel.tsx
├── answer-input.tsx
├── feedback-modal.tsx
└── progress-indicator.tsx
```

---

## Phase 2: Database Design (Supabase)

### Step 2.1: Database Schema

Create migration in Supabase dashboard or via CLI:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Difficulty levels enum
CREATE TYPE difficulty_level AS ENUM ('beginner', 'easy', 'medium', 'hard', 'expert');

-- Programming languages enum
CREATE TYPE programming_language AS ENUM ('javascript', 'python', 'java', 'typescript', 'go', 'rust');

-- Questions table (stores generated content)
CREATE TABLE public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code_snippet TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty difficulty_level NOT NULL,
  language programming_language NOT NULL,
  concepts TEXT[] DEFAULT '{}', -- Tags: ['loops', 'functions', 'async']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- For caching similar difficulty questions
  difficulty_score INTEGER NOT NULL, -- 1-100 scale
  
  CONSTRAINT valid_difficulty_score CHECK (difficulty_score >= 1 AND difficulty_score <= 100)
);

CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_language ON questions(language);
CREATE INDEX idx_questions_score ON questions(difficulty_score);

-- User progress tracking
CREATE TABLE public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, question_id, attempted_at)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_date ON user_progress(attempted_at DESC);

-- User skill levels (adaptive tracking)
CREATE TABLE public.user_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  language programming_language NOT NULL,
  current_difficulty_score INTEGER DEFAULT 10, -- Start at beginner
  total_questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, language),
  CONSTRAINT valid_current_difficulty CHECK (current_difficulty_score >= 1 AND current_difficulty_score <= 100)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);

-- Learning sessions (group attempts into sessions)
CREATE TABLE public.learning_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  language programming_language NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  
  CONSTRAINT valid_session_dates CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX idx_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_sessions_active ON learning_sessions(user_id, ended_at) WHERE ended_at IS NULL;
```

### Step 2.2: Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Questions policies (public read, authenticated write)
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create questions" ON questions FOR INSERT TO authenticated WITH CHECK (true);

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User skills policies
CREATE POLICY "Users can view own skills" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);

-- Learning sessions policies
CREATE POLICY "Users can view own sessions" ON learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON learning_sessions FOR ALL USING (auth.uid() = user_id);
```

### Step 2.3: Database Functions (Advanced Logic)

```sql
-- Function to get or create user skill entry
CREATE OR REPLACE FUNCTION get_or_create_user_skill(
  p_user_id UUID,
  p_language programming_language
)
RETURNS user_skills AS $$
DECLARE
  v_skill user_skills;
BEGIN
  SELECT * INTO v_skill FROM user_skills WHERE user_id = p_user_id AND language = p_language;
  
  IF NOT FOUND THEN
    INSERT INTO user_skills (user_id, language, current_difficulty_score)
    VALUES (p_user_id, p_language, 10)
    RETURNING * INTO v_skill;
  END IF;
  
  RETURN v_skill;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update difficulty after answer
CREATE OR REPLACE FUNCTION update_user_difficulty(
  p_user_id UUID,
  p_language programming_language,
  p_is_correct BOOLEAN,
  p_question_difficulty INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_difficulty INTEGER;
  v_current_streak INTEGER;
BEGIN
  -- Get current skill
  SELECT current_difficulty_score, current_streak 
  INTO v_new_difficulty, v_current_streak
  FROM user_skills 
  WHERE user_id = p_user_id AND language = p_language;
  
  IF p_is_correct THEN
    -- Correct answer: increase difficulty
    v_new_difficulty := LEAST(100, v_new_difficulty + CASE
      WHEN v_current_streak >= 3 THEN 5  -- Hot streak bonus
      WHEN p_question_difficulty > v_new_difficulty THEN 3  -- Answered above level
      ELSE 2
    END);
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Wrong answer: decrease difficulty
    v_new_difficulty := GREATEST(1, v_new_difficulty - CASE
      WHEN v_current_streak > 0 THEN 2  -- Small penalty if on streak
      WHEN p_question_difficulty < v_new_difficulty THEN 5  -- Failed below level
      ELSE 3
    END);
    v_current_streak := 0;
  END IF;
  
  -- Update user skills
  UPDATE user_skills SET
    current_difficulty_score = v_new_difficulty,
    total_questions_attempted = total_questions_attempted + 1,
    correct_answers = correct_answers + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
    current_streak = v_current_streak,
    best_streak = GREATEST(best_streak, v_current_streak),
    last_practiced_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND language = p_language;
  
  RETURN v_new_difficulty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 3: OpenRouter LLM Integration

### Step 3.1: OpenRouter Client Setup

Create `lib/openrouter/client.ts`:

```typescript
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    'X-Title': 'Code Explainer',
  },
});

export default openrouter;
```

### Step 3.2: Prompt Engineering System

Create `lib/openrouter/prompts.ts`:

```typescript
export interface GenerateQuestionParams {
  language: string;
  difficulty: number; // 1-100
  previousConcepts?: string[];
  wasLastCorrect?: boolean;
}

export function buildQuestionPrompt(params: GenerateQuestionParams): string {
  const { language, difficulty, previousConcepts, wasLastCorrect } = params;
  
  // Map 1-100 score to difficulty description
  const difficultyLevel = 
    difficulty <= 20 ? 'beginner (basic syntax, simple variables)' :
    difficulty <= 40 ? 'easy (simple functions, basic control flow)' :
    difficulty <= 60 ? 'medium (intermediate concepts, basic algorithms)' :
    difficulty <= 80 ? 'hard (advanced concepts, complex logic)' :
    'expert (edge cases, performance optimization, advanced patterns)';
  
  const adjustmentGuidance = wasLastCorrect === true
    ? 'Make this slightly harder than the previous question.'
    : wasLastCorrect === false
    ? 'Make this slightly easier to rebuild confidence.'
    : 'Start at an appropriate difficulty level.';
  
  const conceptGuidance = previousConcepts?.length
    ? `Avoid repeating these concepts too directly: ${previousConcepts.join(', ')}. Introduce new related concepts.`
    : 'Choose fundamental concepts appropriate for the difficulty level.';
  
  return `You are an expert ${language} programming instructor. Generate a code comprehension question.

Difficulty: ${difficultyLevel} (Score: ${difficulty}/100)
${adjustmentGuidance}
${conceptGuidance}

Return a JSON object with this exact structure:
{
  "code_snippet": "// Well-commented, properly formatted ${language} code (5-20 lines)",
  "question": "What will this code output? Or: What does line X do? Or: What is the value of variable Y?",
  "correct_answer": "The exact correct answer (concise, specific)",
  "explanation": "Why this is the answer (educational, 2-3 sentences)",
  "concepts": ["concept1", "concept2"], // Array of programming concepts covered
  "difficulty_score": ${difficulty} // The actual difficulty (confirm or adjust by ±2)
}

CRITICAL RULES:
1. Code must be syntactically correct and runnable
2. Question must have ONE unambiguous correct answer
3. Avoid trick questions or overly obscure language features
4. Use realistic code examples, not contrived scenarios
5. Include helpful comments in code for beginner/easy levels
6. For medium/hard/expert: include edge cases, async patterns, or optimization challenges
7. Answer should be testable (exact output, exact value, or clear explanation)
8. Concepts array should have 1-3 items (e.g., ["loops", "array methods", "closures"])

Example for JavaScript beginner (score 15):
{
  "code_snippet": "let x = 5;\\nlet y = 10;\\nlet sum = x + y;\\nconsole.log(sum);",
  "question": "What will be logged to the console?",
  "correct_answer": "15",
  "explanation": "The code adds x (5) and y (10) together, storing the result (15) in sum, then logs it.",
  "concepts": ["variables", "arithmetic", "console.log"],
  "difficulty_score": 15
}

Now generate a question for ${language} at difficulty ${difficulty}.`;
}

export function buildAnswerCheckPrompt(
  question: string,
  correctAnswer: string,
  userAnswer: string
): string {
  return `You are evaluating a student's answer to a programming question.

Question: ${question}
Expected Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Determine if the student's answer is correct. Be lenient with formatting/capitalization, but strict on technical accuracy.

Return JSON:
{
  "is_correct": true or false,
  "feedback": "Encouraging feedback explaining why the answer is right/wrong",
  "hint": "If wrong, provide a helpful hint without giving away the answer"
}

Examples:
- "15" vs "15.0" → correct (equivalent)
- "fifteen" vs "15" → incorrect (must match format unless question allows text)
- "Hello World" vs "hello world" → correct (case-insensitive for strings unless specified)
- Missing semicolon in expected output → incorrect (syntax matters)`;
}
```

### Step 3.3: LLM Generation Service

Create `lib/openrouter/generation-service.ts`:

```typescript
import openrouter from './client';
import { buildQuestionPrompt, buildAnswerCheckPrompt } from './prompts';
import { z } from 'zod';

// Zod schemas for validation
const QuestionSchema = z.object({
  code_snippet: z.string().min(10),
  question: z.string().min(10),
  correct_answer: z.string().min(1),
  explanation: z.string().min(20),
  concepts: z.array(z.string()).min(1).max(5),
  difficulty_score: z.number().int().min(1).max(100),
});

const AnswerCheckSchema = z.object({
  is_correct: z.boolean(),
  feedback: z.string().min(10),
  hint: z.string().optional(),
});

export type GeneratedQuestion = z.infer<typeof QuestionSchema>;
export type AnswerCheck = z.infer<typeof AnswerCheckSchema>;

export async function generateQuestion(params: {
  language: string;
  difficulty: number;
  previousConcepts?: string[];
  wasLastCorrect?: boolean;
}): Promise<GeneratedQuestion> {
  const prompt = buildQuestionPrompt(params);
  
  try {
    const response = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet', // or 'openai/gpt-4-turbo'
      messages: [
        {
          role: 'system',
          content: 'You are a programming education expert. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // Force JSON mode
    });
    
    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from LLM');
    
    const parsed = JSON.parse(content);
    const validated = QuestionSchema.parse(parsed);
    
    return validated;
  } catch (error) {
    console.error('LLM generation error:', error);
    throw new Error('Failed to generate question. Please try again.');
  }
}

export async function checkAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<AnswerCheck> {
  const prompt = buildAnswerCheckPrompt(question, correctAnswer, userAnswer);
  
  try {
    const response = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'You are a fair and encouraging programming teacher. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower for consistency
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from LLM');
    
    const parsed = JSON.parse(content);
    const validated = AnswerCheckSchema.parse(parsed);
    
    return validated;
  } catch (error) {
    console.error('Answer check error:', error);
    throw new Error('Failed to check answer. Please try again.');
  }
}
```

---

## Phase 4: API Routes (Server-Side Logic)

### Step 4.1: Generate Question Endpoint

Create `app/api/generate-question/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateQuestion } from '@/lib/openrouter/generation-service';
import { z } from 'zod';

const RequestSchema = z.object({
  language: z.enum(['javascript', 'python', 'java', 'typescript', 'go', 'rust']),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate request body
    const body = await request.json();
    const { language, sessionId } = RequestSchema.parse(body);
    
    // Get or create user skill level
    const { data: skillData, error: skillError } = await supabase.rpc(
      'get_or_create_user_skill',
      { p_user_id: user.id, p_language: language }
    );
    
    if (skillError) throw skillError;
    
    const currentDifficulty = skillData.current_difficulty_score;
    
    // Get recent attempts for context
    const { data: recentAttempts } = await supabase
      .from('user_progress')
      .select('question_id, is_correct, questions(concepts)')
      .eq('user_id', user.id)
      .order('attempted_at', { ascending: false })
      .limit(5);
    
    const previousConcepts = recentAttempts
      ?.flatMap(a => a.questions?.concepts || [])
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
        created_by: user.id,
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
```

### Step 4.2: Check Answer Endpoint

Create `app/api/check-answer/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { checkAnswer } from '@/lib/openrouter/generation-service';
import { z } from 'zod';

const RequestSchema = z.object({
  questionId: z.string().uuid(),
  userAnswer: z.string().min(1),
  timeSpentSeconds: z.number().int().min(0).optional(),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
        user_id: user.id,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: answerCheck.is_correct,
        time_spent_seconds: timeSpentSeconds,
      });
    
    if (progressError) throw progressError;
    
    // Update user difficulty level
    const { data: newDifficulty } = await supabase.rpc('update_user_difficulty', {
      p_user_id: user.id,
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
```

---

## Phase 5: Frontend Components (UI/UX)

### Step 5.1: Learning Interface Layout

Create `app/(dashboard)/learn/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/stores/learning-store';
import CodeViewer from '@/components/code-viewer';
import QuestionPanel from '@/components/question-panel';
import FeedbackModal from '@/components/feedback-modal';
import ProgressIndicator from '@/components/progress-indicator';

export default function LearnPage() {
  const {
    currentQuestion,
    isLoading,
    feedback,
    fetchNewQuestion,
    submitAnswer,
    clearFeedback,
  } = useLearningStore();
  
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  
  useEffect(() => {
    // Load first question on mount
    if (!currentQuestion) {
      fetchNewQuestion(selectedLanguage);
    }
  }, []);
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Code Learning Lab</h1>
          <ProgressIndicator />
        </div>
      </header>
      
      {/* Main split-screen layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Code Viewer */}
        <div className="w-1/2 border-r overflow-auto">
          <CodeViewer
            code={currentQuestion?.codeSnippet}
            language={selectedLanguage}
            isLoading={isLoading}
          />
        </div>
        
        {/* Right: Question Panel */}
        <div className="w-1/2 overflow-auto">
          <QuestionPanel
            question={currentQuestion}
            isLoading={isLoading}
            onSubmit={submitAnswer}
            onNextQuestion={() => fetchNewQuestion(selectedLanguage)}
          />
        </div>
      </main>
      
      {/* Feedback Modal */}
      {feedback && (
        <FeedbackModal
          feedback={feedback}
          onClose={clearFeedback}
          onNext={() => {
            clearFeedback();
            fetchNewQuestion(selectedLanguage);
          }}
        />
      )}
    </div>
  );
}
```

### Step 5.2: Code Viewer Component

Create `components/code-viewer.tsx`:

```typescript
'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Skeleton } from '@/components/ui/skeleton';

interface CodeViewerProps {
  code?: string;
  language: string;
  isLoading: boolean;
}

export default function CodeViewer({ code, language, isLoading }: CodeViewerProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }
  
  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No code snippet available</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Code header with language badge */}
      <div className="border-b bg-muted/30 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Code Snippet
        </span>
        <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded-full">
          {language}
        </span>
      </div>
      
      {/* Code display */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            background: 'transparent',
          }}
          showLineNumbers
          wrapLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
      
      {/* UX Enhancement: Copy button */}
      <div className="border-t bg-muted/30 px-6 py-3">
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          📋 Copy code
        </button>
      </div>
    </div>
  );
}
```

### Step 5.3: Question Panel Component

Create `components/question-panel.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface QuestionPanelProps {
  question: any;
  isLoading: boolean;
  onSubmit: (answer: string) => void;
  onNextQuestion: () => void;
}

export default function QuestionPanel({
  question,
  isLoading,
  onSubmit,
  onNextQuestion,
}: QuestionPanelProps) {
  const [answer, setAnswer] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Reset state when new question loads
  useEffect(() => {
    if (question) {
      setAnswer('');
      setStartTime(Date.now());
      // Auto-focus answer input (UX improvement)
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [question?.id]);
  
  const handleSubmit = () => {
    if (!answer.trim()) return;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onSubmit(answer);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }
  
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full">
        <Button onClick={onNextQuestion}>Start Learning</Button>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col p-6">
      {/* Difficulty indicator */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
          ${question.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'easy' ? 'bg-blue-100 text-blue-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            question.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'}`}>
          {question.difficulty} · Score: {question.currentScore}/100
        </span>
      </div>
      
      {/* Question text */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Question</h2>
        <p className="text-lg leading-relaxed">{question.question}</p>
        
        {/* Concepts tags (helps learner understand what's being tested) */}
        {question.concepts && question.concepts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {question.concepts.map((concept: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </Card>
      
      {/* Answer input */}
      <div className="flex-1 flex flex-col">
        <label htmlFor="answer" className="text-sm font-medium mb-2">
          Your Answer
        </label>
        <Textarea
          ref={textareaRef}
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="flex-1 resize-none font-mono"
          onKeyDown={(e) => {
            // Submit on Cmd+Enter or Ctrl+Enter (UX shortcut)
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
        </p>
      </div>
      
      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          size="lg"
          className="flex-1"
        >
          Submit Answer
        </Button>
        <Button
          onClick={onNextQuestion}
          variant="outline"
          size="lg"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
```

### Step 5.4: Feedback Modal Component

Create `components/feedback-modal.tsx`:

```typescript
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
            <DialogTitle className="text-2xl">
              {isCorrect ? '🎉 Correct!' : '❌ Not Quite'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* AI Feedback */}
          <div className="p-4 rounded-lg bg-muted">
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
            <p className="font-mono text-lg bg-secondary px-3 py-2 rounded">
              {correctAnswer}
            </p>
          </div>
          
          {/* Explanation */}
          {explanation && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Explanation</p>
              <p className="leading-relaxed">{explanation}</p>
            </div>
          )}
          
          {/* Difficulty change indicator */}
          {newDifficultyScore && (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                {isCorrect ? '📈 Difficulty increased' : '📉 Difficulty adjusted'} to{' '}
                <span className="font-bold">{newDifficultyScore}/100</span>
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onNext} size="lg" className="w-full">
            Next Question →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 6: State Management (Zustand)

Create `lib/stores/learning-store.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Question {
  id: string;
  codeSnippet: string;
  question: string;
  concepts: string[];
  difficulty: string;
  currentScore: number;
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
          set({ currentQuestion: data, isLoading: false });
        } catch (error) {
          console.error(error);
          set({ isLoading: false });
          // TODO: Show error toast
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
        const response = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language }),
        });
        
        const { sessionId } = await response.json();
        set({ sessionId });
      },
      
      endSession: async () => {
        const sessionId = get().sessionId;
        if (!sessionId) return;
        
        await fetch(`/api/sessions/${sessionId}/end`, { method: 'POST' });
        set({ sessionId: null });
      },
    }),
    { name: 'learning-store' }
  )
);
```

---

## Phase 7: Critical UX Enhancements

### Step 7.1: Accessibility Features

```typescript
// Add to components where applicable:

// Keyboard navigation
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && e.shiftKey) onNext();
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);

// ARIA labels
<button aria-label="Submit your answer" />
<div role="alert" aria-live="polite">{feedback}</div>

// Focus management (trap focus in modals)
import { FocusTrap } from '@radix-ui/react-focus-scope';
```

### Step 7.2: Loading States & Skeletons

Always show skeleton loading instead of blank screens:
- Code viewer: Line-based skeletons
- Question panel: Text skeletons
- Never show "Loading..." text alone

### Step 7.3: Error Boundaries

Create `components/error-boundary.tsx`:

```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">
              We're having trouble loading this content.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Step 7.4: Responsive Design Breakpoints

```typescript
// Mobile-first approach
<div className="flex flex-col lg:flex-row">
  {/* Code viewer */}
  <div className="w-full lg:w-1/2 h-[50vh] lg:h-screen">
    <CodeViewer />
  </div>
  
  {/* Question panel */}
  <div className="w-full lg:w-1/2 h-[50vh] lg:h-screen">
    <QuestionPanel />
  </div>
</div>

// Mobile: Stack vertically with scroll
// Desktop: Side-by-side split
```

---

## Phase 8: Testing & Edge Cases

### Step 8.1: Critical Edge Cases to Handle

1. **Network failures**: Retry logic with exponential backoff
2. **LLM timeouts**: Set 30s timeout, show retry option
3. **Invalid JSON from LLM**: Fallback to re-generation
4. **Empty code snippets**: Validate before saving
5. **Concurrent answer submissions**: Debounce submit button
6. **Session timeout during question**: Graceful re-auth
7. **Browser tab close**: Save progress before unload
8. **Rate limiting**: Handle 429 errors from OpenRouter
9. **Inconsistent difficulty**: Validate score stays in 1-100 range
10. **XSS in code snippets**: Sanitize before rendering

### Step 8.2: Unit & Integration Tests

Create `__tests__/difficulty-algorithm.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Difficulty adjustment', () => {
  it('should increase difficulty after correct answer', () => {
    const current = 50;
    const result = adjustDifficulty(current, true, 50);
    expect(result).toBeGreaterThan(current);
  });
  
  it('should not exceed 100', () => {
    const result = adjustDifficulty(98, true, 98);
    expect(result).toBeLessThanOrEqual(100);
  });
  
  it('should decrease on wrong answer', () => {
    const current = 50;
    const result = adjustDifficulty(current, false, 50);
    expect(result).toBeLessThan(current);
  });
});
```

### Step 8.3: E2E Testing with Playwright

Create `e2e/learning-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Learning flow', () => {
  test('should complete full learning cycle', async ({ page }) => {
    await page.goto('/learn');
    
    // Wait for question to load
    await expect(page.locator('pre code')).toBeVisible();
    await expect(page.locator('text=Question')).toBeVisible();
    
    // Submit answer
    await page.fill('textarea', '15');
    await page.click('button:has-text("Submit Answer")');
    
    // Wait for feedback
    await expect(page.locator('dialog')).toBeVisible();
    await expect(page.locator('text=Correct!, text=Not Quite')).toBeVisible();
    
    // Go to next question
    await page.click('button:has-text("Next Question")');
    await expect(page.locator('dialog')).not.toBeVisible();
  });
});
```

---

## Phase 9: Performance Optimization

### Step 9.1: Code Splitting & Lazy Loading

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const CodeViewer = dynamic(() => import('@/components/code-viewer'), {
  loading: () => <CodeViewerSkeleton />,
  ssr: false, // Syntax highlighter doesn't need SSR
});

const FeedbackModal = dynamic(() => import('@/components/feedback-modal'), {
  loading: () => <div>Loading...</div>,
});
```

### Step 9.2: Database Query Optimization

```sql
-- Add composite indexes for common queries
CREATE INDEX idx_user_progress_user_date ON user_progress(user_id, attempted_at DESC);
CREATE INDEX idx_questions_lang_diff ON questions(language, difficulty_score);

-- Use covering indexes to avoid table lookups
CREATE INDEX idx_questions_cover ON questions(id, language, difficulty_score) 
INCLUDE (code_snippet, question_text, concepts);
```

### Step 9.3: Caching Strategy

```typescript
// Next.js Route Handlers with caching
export const revalidate = 3600; // Revalidate every hour

// React Query for client-side caching
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});
```

### Step 9.4: OpenRouter Request Optimization

```typescript
// Implement request queuing to avoid rate limits
class LLMQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly delayMs = 1000; // 1 request per second
  
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      await request();
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
    
    this.processing = false;
  }
}

export const llmQueue = new LLMQueue();
```

---

## Phase 10: Advanced Features (Post-MVP)

### Step 10.1: Hint System

```typescript
// Add progressive hints that don't give away answer
interface Hint {
  level: 1 | 2 | 3;
  text: string;
  cost: number; // Deduct from score
}

// Generate hints via LLM
async function generateHints(question: string, code: string): Promise<Hint[]> {
  const prompt = `Given this question: "${question}"
And this code: "${code}"

Generate 3 progressive hints that guide the student without revealing the answer:
1. High-level concept hint
2. Specific line/variable hint
3. Almost-answer hint (without exact answer)

Return JSON array of {level, text}.`;
  
  // LLM call...
}
```

### Step 10.2: Spaced Repetition Algorithm

```typescript
// Implement SM-2 algorithm for optimal review timing
interface ReviewCard {
  questionId: string;
  easeFactor: number; // 1.3 - 2.5
  interval: number; // Days until next review
  nextReviewDate: Date;
}

function calculateNextReview(
  card: ReviewCard,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): ReviewCard {
  // SM-2 algorithm implementation
  const newEaseFactor = Math.max(1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  let newInterval: number;
  if (quality < 3) {
    newInterval = 1; // Review tomorrow if failed
  } else {
    newInterval = card.interval === 0 ? 1 :
                  card.interval === 1 ? 6 :
                  Math.round(card.interval * newEaseFactor);
  }
  
  return {
    ...card,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewDate: addDays(new Date(), newInterval),
  };
}
```

### Step 10.3: Social Features

```typescript
// Leaderboards
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  language programming_language,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  week_start DATE,
  
  UNIQUE(user_id, language, week_start)
);

// Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB, -- {type: 'streak', value: 7}
  points INTEGER DEFAULT 10
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY(user_id, achievement_id)
);
```

### Step 10.4: Code Execution (Advanced)

```typescript
// SECURITY WARNING: Never run untrusted code directly
// Use sandboxed environments like Judge0, Piston, or AWS Lambda

async function executeCode(code: string, language: string) {
  const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY!,
    },
    body: JSON.stringify({
      source_code: code,
      language_id: getLanguageId(language),
      stdin: '',
    }),
  });
  
  const { token } = await response.json();
  
  // Poll for results
  let result;
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`);
    if (result.status.id > 2) break; // Not processing/queued
  }
  
  return result;
}
```

---

## Phase 11: Deployment & DevOps

### Step 11.1: Environment Configuration

Create `.env.production`:

```env
# Production URLs
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# OpenRouter with higher rate limits
OPENROUTER_API_KEY=your-production-key

# Production domain
NEXT_PUBLIC_APP_URL=https://yourapp.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

### Step 11.2: Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables
vercel env add OPENROUTER_API_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
vercel --prod
```

Configure `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://yourapp.vercel.app"
  },
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

### Step 11.3: Monitoring & Error Tracking

Install Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
```

### Step 11.4: Database Backups (Supabase)

```sql
-- Enable Point-in-Time Recovery (PITR)
-- Via Supabase dashboard: Database > Backups > Enable PITR

-- Schedule daily backups
SELECT cron.schedule(
  'daily-backup',
  '0 2 * * *', -- 2 AM daily
  $
  SELECT pg_dump('postgres://...');
  $
);
```

### Step 11.5: CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      
      - name: Build
        run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Phase 12: Critical Security Considerations

### Step 12.1: Input Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Sanitize all user inputs
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: [],
  });
}

// Validate with Zod schemas
const UserAnswerSchema = z.string()
  .min(1)
  .max(1000)
  .transform(sanitizeInput);
```

### Step 12.2: Rate Limiting

Install rate limiter:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Create `lib/rate-limit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

// Use in API routes
export async function checkRateLimit(identifier: string) {
  const { success, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  return remaining;
}
```

### Step 12.3: SQL Injection Prevention

```typescript
// ALWAYS use parameterized queries
// ✅ CORRECT:
const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('language', userInput); // Parameterized

// ❌ WRONG (vulnerable to SQL injection):
const query = `SELECT * FROM questions WHERE language = '${userInput}'`;
```

### Step 12.4: API Key Security

```typescript
// NEVER expose service role key to client
// ✅ CORRECT (server-side only):
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
  { auth: { persistSession: false } }
);

// ❌ WRONG (exposed to client):
const client = createClient(url, serviceRoleKey); // In client component
```

---

## Phase 13: UX Polish & Accessibility

### Step 13.1: Loading States Everywhere

```typescript
// Never show blank screens
const LoadingState = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);

// Use throughout app
{isLoading ? <LoadingState /> : <Content />}
```

### Step 13.2: Optimistic UI Updates

```typescript
// Show immediate feedback, revert on error
const handleSubmit = async (answer: string) => {
  // Optimistically update UI
  setIsSubmitted(true);
  
  try {
    const result = await submitAnswer(answer);
    setFeedback(result);
  } catch (error) {
    // Revert optimistic update
    setIsSubmitted(false);
    toast.error('Submission failed. Please try again.');
  }
};
```

### Step 13.3: Keyboard Shortcuts

```typescript
// Add keyboard navigation
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Skip question: 'S' key
    if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
      handleSkip();
    }
    
    // Submit: Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
    
    // Show hints: 'H' key
    if (e.key === 'h' && !e.metaKey && !e.ctrlKey) {
      showHint();
    }
  };
  
  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, []);
```

### Step 13.4: WCAG 2.1 Compliance

```typescript
// Ensure proper contrast ratios (4.5:1 for text)
// Use semantic HTML
<main role="main">
  <article aria-label="Code snippet">
    <pre><code>{codeSnippet}</code></pre>
  </article>
  
  <aside aria-label="Question panel">
    <h2 id="question-heading">Question</h2>
    <p>{question}</p>
    
    <form aria-labelledby="question-heading">
      <label htmlFor="answer">Your answer</label>
      <textarea
        id="answer"
        aria-required="true"
        aria-describedby="answer-hint"
      />
      <p id="answer-hint" className="sr-only">
        Enter your answer and press Cmd+Enter to submit
      </p>
    </form>
  </aside>
</main>

// Screen reader announcements
<div role="status" aria-live="polite" aria-atomic="true">
  {feedback && `Answer ${feedback.isCorrect ? 'correct' : 'incorrect'}`}
</div>
```

---

## Phase 14: Analytics & User Insights

### Step 14.1: Custom Analytics Events

```typescript
// Track learning behavior
export function trackEvent(
  event: string,
  properties?: Record<string, any>
) {
  // PostHog, Mixpanel, or custom analytics
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(event, properties);
  }
}

// Usage throughout app
trackEvent('question_answered', {
  difficulty: question.difficulty,
  isCorrect: result.isCorrect,
  timeSpent: timeSpentSeconds,
  language: question.language,
});

trackEvent('difficulty_adjusted', {
  previousScore: oldScore,
  newScore: newScore,
  direction: newScore > oldScore ? 'increased' : 'decreased',
});
```

### Step 14.2: User Feedback Collection

```typescript
// Add feedback button on every question
<Button
  variant="ghost"
  onClick={() => setShowFeedbackForm(true)}
>
  📝 Report Issue
</Button>

// Feedback form
<Dialog open={showFeedbackForm}>
  <DialogContent>
    <form onSubmit={submitFeedback}>
      <Select name="issue_type">
        <option value="incorrect_answer">Incorrect answer</option>
        <option value="unclear_question">Unclear question</option>
        <option value="bug">Technical bug</option>
      </Select>
      <Textarea name="details" placeholder="Describe the issue..." />
      <Button type="submit">Submit Feedback</Button>
    </form>
  </DialogContent>
</Dialog>
```

---

## Final Checklist Before Launch

### Pre-Launch Verification

- [ ] All environment variables set in production
- [ ] Database migrations applied to production
- [ ] RLS policies tested and verified
- [ ] API rate limits configured
- [ ] Error tracking (Sentry) working
- [ ] Analytics tracking verified
- [ ] Mobile responsive design tested
- [ ] Accessibility audit passed (WAVE, axe)
- [ ] Load testing completed (k6 or Artillery)
- [ ] SEO meta tags added
- [ ] OpenGraph images configured
- [ ] Privacy policy and Terms of Service added
- [ ] GDPR compliance (if applicable)
- [ ] Backup and disaster recovery plan documented
- [ ] Monitoring alerts configured
- [ ] Cost monitoring for OpenRouter API usage set up

### Performance Targets

- [ ] Lighthouse score > 90 (Performance)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Total bundle size < 200KB (gzipped)
- [ ] API response time < 500ms (P95)
- [ ] LLM generation time < 10s (P95)

### Security Checklist

- [ ] No API keys in client-side code
- [ ] All user inputs sanitized
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Content Security Policy configured
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] Password requirements meet OWASP standards

---

## Common Pitfalls & How to Avoid Them

### Pitfall 1: LLM Inconsistency
**Problem**: LLM generates inconsistent difficulty or invalid code.
**Solution**:
- Use temperature 0.3-0.7 for consistency
- Validate ALL outputs with Zod schemas
- Implement retry logic with modified prompts
- Store successful generations as templates
- Add manual review queue for flagged questions

### Pitfall 2: Database Performance Degradation
**Problem**: Queries slow down as data grows.
**Solution**:
- Add indexes BEFORE they're needed
- Use EXPLAIN ANALYZE to profile queries
- Implement pagination (limit 50 per page)
- Archive old data after 6 months
- Use materialized views for complex aggregations

### Pitfall 3: Cost Overruns (OpenRouter)
**Problem**: LLM API costs spiral out of control.
**Solution**:
- Cache generated questions (reuse for similar difficulty)
- Implement request batching
- Use cheaper models for simple tasks (Haiku vs Opus)
- Set hard daily spending limits in OpenRouter dashboard
- Monitor costs with alerts at $10, $50, $100 thresholds

### Pitfall 4: Poor Mobile UX
**Problem**: Split-screen doesn't work on mobile.
**Solution**:
- Use tabs instead of split on mobile
- Implement swipe gestures to switch views
- Show code snippet as expandable section
- Use fixed header with compact controls
- Test on real devices, not just Chrome DevTools

### Pitfall 5: User Frustration from Too Hard Questions
**Problem**: Algorithm increases difficulty too aggressively.
**Solution**:
- Cap difficulty increases to +2 per correct answer
- Require 3 consecutive correct for difficulty jump
- Add "This is too hard" button (decreases difficulty)
- Show progress visualization ("You're 60% to next level")
- Implement warm-up questions at start of session

---

## Conclusion

This guide provides a comprehensive blueprint for building an adaptive code learning platform. Remember:

1. **Start with MVP**: Get core learning loop working first
2. **Iterate based on user feedback**: Track which questions users struggle with
3. **Monitor costs closely**: LLM APIs can get expensive quickly
4. **Prioritize UX**: Smooth, responsive experience keeps users engaged
5. **Security first**: Never compromise on input validation and data protection

**Next Steps After Following This Guide**:
1. Set up basic auth and landing page
2. Implement core learning loop (Phases 1-5)
3. Deploy MVP to production
4. Gather user feedback
5. Add advanced features (hints, spaced repetition, leaderboards)
6. Scale infrastructure as needed

Good luck building! 🚀