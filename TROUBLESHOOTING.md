# Troubleshooting Guide

## Environment Variable Issues

### Error: "supabaseKey is required"

This error means Next.js cannot read your environment variables from `.env.local`.

**Solution:**

1. **Restart the dev server** - Next.js only reads `.env.local` on startup
   ```bash
   # Stop the current dev server (Ctrl+C)
   npm run dev
   ```

2. **Verify your `.env.local` file** has these exact variable names:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   OPENROUTER_API_KEY=your-openrouter-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Check for common issues:**
   - ❌ No spaces around `=` sign
   - ❌ No quotes around values (unless the value contains spaces)
   - ❌ File must be named exactly `.env.local` (not `.env` or `env.local`)
   - ❌ File must be in the project root directory
   - ✅ Variables starting with `NEXT_PUBLIC_` are accessible in browser
   - ✅ Variables without `NEXT_PUBLIC_` are server-only

### After fixing .env.local

**Always restart the dev server:**
```bash
# Stop with Ctrl+C, then:
npm run dev
```

## Common Errors

### "Unauthorized" from API

**Cause:** No authentication implemented yet

**Solutions:**
1. **Implement Supabase Auth** (recommended for production)
2. **Temporary bypass for testing:**
   - Comment out auth check in API routes
   - Use a test user ID

### "Question not found" or Database Errors

**Cause:** Database schema not set up

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Paste entire `supabase/schema.sql` file
3. Run the script
4. Verify tables were created in Table Editor

### LLM Generation Fails

**Possible causes:**
- Invalid OpenRouter API key
- No credits on OpenRouter account
- Network issues

**Solution:**
1. Verify API key at [openrouter.ai](https://openrouter.ai)
2. Check account has credits
3. Test with a simple curl request:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

### Build Errors

**"Export doesn't exist" errors:**
- Already fixed - using direct `@supabase/supabase-js` client

**TypeScript errors:**
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild: `rm -rf .next && npm run dev`

### Source Map Warnings

The "Invalid source map" warnings are **harmless** - they're from Next.js dependencies and don't affect functionality. You can ignore them.

## Verification Checklist

Before testing `/learn`:
- [ ] `.env.local` file exists in project root
- [ ] All 5 environment variables are set
- [ ] Dev server was restarted after adding `.env.local`
- [ ] Supabase database schema was executed
- [ ] OpenRouter API key is valid and has credits

## Getting Help

If you're still stuck:
1. Check the error message in terminal
2. Verify environment variables are loaded:
   - Add `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)` to an API route
   - Should print your URL (not `undefined`)
3. Check Supabase dashboard for database errors
4. Review `ENV_SETUP.md` for detailed setup instructions
