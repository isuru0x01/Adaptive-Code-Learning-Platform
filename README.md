# Adaptive Code Learning Platform

An AI-powered platform that teaches programming through adaptive difficulty code comprehension questions.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in the SQL Editor
   - Copy your project URL and keys

3. **Configure environment**
   - Copy `.env.example` to `.env.local` (or create `.env.local`)
   - Add your Supabase and OpenRouter credentials
   - See `ENV_SETUP.md` for detailed instructions

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Visit the app**
   - Open [http://localhost:3000/learn](http://localhost:3000/learn)

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[ENV_SETUP.md](./ENV_SETUP.md)** - Environment variables guide
- **[AGENTS.md](./AGENTS.md)** - Full development guide (all phases)

## ✨ Features

- **6 Programming Languages**: JavaScript, Python, TypeScript, Java, Go, Rust
- **Adaptive Difficulty**: Questions adjust based on your performance (1-100 scale)
- **AI-Generated Content**: Unique questions powered by Claude 3.5 Sonnet
- **Smart Validation**: Fuzzy answer matching with helpful feedback
- **Progress Tracking**: Streaks, skill levels, and performance analytics

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth)
- OpenRouter API (Claude 3.5 Sonnet)
- Tailwind CSS
- Zustand (State Management)
- react-syntax-highlighter

## 📁 Project Structure

```
app/
├── api/                    # API routes
│   ├── generate-question/  # LLM question generation
│   └── check-answer/       # Answer validation
└── learn/                  # Main learning interface

lib/
├── openrouter/            # LLM integration
├── supabase/              # Database clients
├── stores/                # State management
└── types/                 # TypeScript types

components/
├── code-viewer.tsx        # Syntax-highlighted code display
├── question-panel.tsx     # Question and answer input
├── feedback-modal.tsx     # Answer feedback
└── ...

supabase/
└── schema.sql            # Database schema
```

## 🎯 How It Works

1. Select a programming language
2. System generates a code question at your current difficulty level
3. Read the code and answer the question
4. Get instant AI-powered feedback
5. Difficulty adjusts based on your performance
6. Track your progress and streaks!

## 🔧 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Next Steps

- [ ] Implement Supabase authentication (login/signup pages)
- [ ] Add responsive mobile design
- [ ] Create progress dashboard
- [ ] Add hints system
- [ ] Implement leaderboards

## 🐛 Troubleshooting

**Build errors?** Make sure all environment variables are set correctly.

**Auth errors?** Verify Supabase credentials and that schema.sql was run.

**LLM errors?** Check OpenRouter API key and account credits.

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the development guide in AGENTS.md.
