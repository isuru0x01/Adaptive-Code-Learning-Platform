# Environment Configuration

## Required Environment Variables

Create a `.env.local` file in the root directory with these values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development Mode (optional - bypasses auth for testing)
# Remove this in production!
NEXT_PUBLIC_DEV_MODE=true
```

## Where to Get These Values

### Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to: Project Settings → API
3. Copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### OpenRouter
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up and navigate to Keys
3. Create a new API key
4. Copy to `OPENROUTER_API_KEY`

## Important Notes

- **Never commit `.env.local`** - it's already in `.gitignore`
- **Service role key** should NEVER be exposed to the client
- **DEV_MODE** should only be used for local testing
- In production, implement proper Supabase authentication

## Testing Without Full Auth Setup

For quick testing, you can:
1. Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`
2. The app will use a mock user ID for testing
3. **Remove this before deploying to production!**
