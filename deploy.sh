#!/bin/bash

echo "🚀 Building project for Namecheap deployment..."

# Clean previous build
rm -rf dist
rm -f deployment.zip

# Build the project
echo "📦 Building React application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

# Copy .htaccess to dist folder
echo "📋 Copying .htaccess file..."
cp public/.htaccess dist/

# Create deployment package
echo "🗜️ Creating deployment package..."
cd dist
zip -r ../deployment.zip . -x "*.DS_Store" "*.git*"
cd ..

echo "✅ Deployment package created: deployment.zip"
echo ""
echo "📋 Next steps:"
echo "1. Upload deployment.zip to your Namecheap hosting"
echo "2. Extract the contents to your public_html folder"
echo "3. Make sure your Supabase environment variables are correct"
echo "4. Test your application at your domain"
echo ""
echo "🔗 Your Supabase URL: ${VITE_SUPABASE_URL:-'Check your .env file'}"