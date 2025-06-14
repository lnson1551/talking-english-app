#!/bin/bash

echo "🚀 Talking English App - Environment Setup"
echo "=========================================="
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo "📝 Please enter your Supabase credentials:"
echo ""

# Get Supabase URL
read -p "Enter your Supabase Project URL (e.g., https://your-project.supabase.co): " SUPABASE_URL

# Get Supabase Anon Key
read -p "Enter your Supabase Anon Key (starts with eyJ...): " SUPABASE_ANON_KEY

# Validate inputs
if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" ]]; then
    echo "❌ Error: Both URL and Anon Key are required!"
    exit 1
fi

# Create .env.local file
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo ""
echo "✅ Environment file created successfully!"
echo "📁 File: .env.local"
echo ""
echo "🔧 Next steps:"
echo "1. Run the SQL schema in your Supabase SQL Editor"
echo "2. Configure authentication settings in Supabase"
echo "3. Start the development server: npm run dev"
echo ""
echo "📚 For detailed instructions, see SUPABASE_SETUP.md" 