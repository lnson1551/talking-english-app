# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the details:
   - **Organization**: Select your org
   - **Name**: `talking-english-app` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait 2-3 minutes for setup to complete

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your project root:
```bash
touch .env.local
```

2. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace the values with your actual Supabase credentials**

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `database-schema.sql`
4. Click "Run" to execute the SQL

This will create:
- `user_profiles` table
- `rooms` table  
- `room_participants` table
- Row Level Security policies
- Triggers for automatic profile creation

## Step 5: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under "Site URL", add your development URL: `http://localhost:3000`
3. Under "Redirect URLs", add:
   - `http://localhost:3000/login`
   - `http://localhost:3000/signup`
   - `http://localhost:3000/forgot-password`
   - `http://localhost:3000/reset-password`

## Step 6: Enable Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## Step 7: Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. Try to sign up with a test email
4. Check that the user profile is created automatically

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**:
   - Double-check your anon key in `.env.local`
   - Make sure there are no extra spaces or characters

2. **"Table doesn't exist" error**:
   - Make sure you ran the SQL schema in Supabase SQL Editor
   - Check that all tables were created successfully

3. **Authentication not working**:
   - Verify your Site URL and Redirect URLs in Auth settings
   - Check that email confirmation is properly configured

4. **Real-time not working**:
   - Ensure Realtime is enabled in your Supabase project
   - Check that you're using the correct project URL

### Verification Steps

1. **Check Tables**: Go to **Table Editor** and verify these tables exist:
   - `user_profiles`
   - `rooms`
   - `room_participants`

2. **Check Policies**: Go to **Authentication** → **Policies** and verify RLS policies are active

3. **Test Auth**: Try creating a user and check if profile is auto-created

## Production Deployment

When deploying to production:

1. Update your Site URL and Redirect URLs in Supabase Auth settings
2. Add your production domain to the allowed URLs
3. Consider setting up custom email templates
4. Monitor your database usage and API calls

## Security Notes

- Never commit your `.env.local` file to version control
- The anon key is safe to use in client-side code
- Row Level Security (RLS) is enabled by default
- All database operations are properly secured with policies 