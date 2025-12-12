# Adaptive Code Learning Platform - Setup Guide

## 🚀 Quick Start

This is an adaptive code learning platform built with Next.js that teaches programming through AI-generated code comprehension questions.

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- An OpenRouter API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the entire `supabase/schema.sql` file to create all tables, policies, and functions

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these values:**
- Supabase URL and keys: Project Settings → API in your Supabase dashboard
- OpenRouter API key: [openrouter.ai](https://openrouter.ai) → Keys

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/learn](http://localhost:3000/learn) to start learning!

## 📁 Project Structure

```
app/
├── api/
│   ├── generate-question/    # LLM question generation endpoint
│   └── check-answer/          # Answer validation endpoint
├── learn/                     # Main learning interface
└── ...

lib/
├── openrouter/               # OpenRouter LLM integration
│   ├── client.ts
│   ├── prompts.ts
│   └── generation-service.ts
├── supabase/                 # Supabase clients
│   ├── client.ts
│   └── server.ts
├── stores/                   # Zustand state management
│   └── learning-store.ts
└── types/                    # TypeScript types
    └── index.ts

components/
├── code-viewer.tsx           # Syntax-highlighted code display
├── question-panel.tsx        # Question and answer input
├── feedback-modal.tsx        # Answer feedback display
├── progress-indicator.tsx    # User progress tracking
└── error-boundary.tsx        # Error handling
```

## 🎯 How It Works

1. **Adaptive Difficulty**: The system tracks your performance and adjusts question difficulty (1-100 scale)
2. **AI-Generated Questions**: Uses OpenRouter (Claude/GPT) to generate unique code comprehension questions
3. **Smart Answer Checking**: LLM validates answers with fuzzy matching for flexibility
4. **Progress Tracking**: Stores your attempts, streaks, and skill levels per programming language

## 🔑 Key Features

- **6 Programming Languages**: JavaScript, Python, TypeScript, Java, Go, Rust
- **Split-Screen Interface**: Code on left, question on right
- **Real-time Feedback**: Instant AI-powered answer validation
- **Difficulty Adaptation**: Questions get harder/easier based on performance
- **Keyboard Shortcuts**: Cmd/Ctrl+Enter to submit answers

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter (Claude 3.5 Sonnet)
- **State Management**: Zustand
- **Syntax Highlighting**: react-syntax-highlighter

## 📝 Next Steps

1. **Authentication**: Implement Supabase Auth for user login/signup
2. **Testing**: Add the verification steps from Phase 8
3. **Responsive Design**: Enhance mobile experience
4. **Performance**: Add code splitting and caching
5. **Advanced Features**: Hints system, progress analytics, leaderboards

## 🐛 Troubleshooting

**"Unauthorized" errors**: Make sure you've set up Supabase Auth and are logged in

**LLM generation fails**: Check your OpenRouter API key and ensure you have credits

**Database errors**: Verify the schema.sql was run successfully in Supabase

**Build errors**: Make sure all dependencies are installed with `npm install`

## 📚 Documentation

For detailed implementation details, see `AGENTS.md` which contains the complete development guide.
