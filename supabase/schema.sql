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