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

# Create deployment package with both frontend and backend
echo "🗜️ Creating deployment package..."
zip -r deployment.zip dist/ api/ database/ -x "*.DS_Store" "*.git*"

echo "✅ Deployment package created: deployment.zip"
echo ""
echo "📋 Next steps:"
echo "1. Upload deployment.zip to your Namecheap hosting"
echo "2. Extract the contents:"
echo "   - Move contents of 'dist' folder to public_html"
echo "   - Move 'api' folder to public_html/api"
echo "   - Move 'database' folder to public_html/database"
echo "3. Set up your MySQL database using database/schema.sql"
echo "4. Update api/config/database.php with your database credentials"
echo "5. Test your application at your domain"
echo ""
echo "🔧 Don't forget to:"
echo "- Set proper file permissions (644 for files, 755 for directories)"
echo "- Change default passwords in the database"
echo "- Enable SSL certificate"