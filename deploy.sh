#!/bin/bash

# Build frontend
echo "Building frontend..."
npm run build

# Build backend
echo "Building backend..."
cd server
npm run build

# Create deployment package
echo "Creating deployment package..."
cd ..
zip -r deploy.zip build/* server/dist/* server/package.json server/.env .htaccess .cpanel.yml
echo "Deployment package created: deploy.zip"

echo "Deployment package is ready to be uploaded to Namecheap hosting."
echo "After uploading, extract the package in your public_html directory."