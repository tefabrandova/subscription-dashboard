# Deployment Guide for Namecheap Shared Hosting

## Prerequisites

1. **Namecheap Shared Hosting Account** with cPanel access
2. **Supabase Project** (already configured)
3. **Domain** pointed to your Namecheap hosting

## Step-by-Step Deployment

### 1. Prepare Your Project

First, make sure your environment variables are correctly set in `.env`:

```env
VITE_SUPABASE_URL=https://hohsvrzyoluzhtsbifyo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaHN2cnp5b2x1emh0c2JpZnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNzUyNTcsImV4cCI6MjA2Mzg1MTI1N30.Qv_HcZWMaVprc4XHWRMSdCaFXvaRCC2ntY0tK_uVtl0
```

### 2. Build the Project

Run the deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
- Build your React application
- Copy necessary files
- Create a `deployment.zip` file

### 3. Upload to Namecheap

#### Option A: Using cPanel File Manager

1. Log into your Namecheap cPanel
2. Open **File Manager**
3. Navigate to `public_html` folder
4. Upload `deployment.zip`
5. Right-click the zip file and select **Extract**
6. Delete the zip file after extraction

#### Option B: Using FTP

1. Connect to your hosting via FTP
2. Navigate to `public_html` folder
3. Upload all files from the `dist` folder
4. Make sure `.htaccess` file is uploaded

### 4. Configure Domain (if needed)

If using a subdomain or custom domain:

1. In cPanel, go to **Subdomains** or **Addon Domains**
2. Point your domain to the `public_html` folder
3. Wait for DNS propagation (up to 24 hours)

### 5. Test Your Application

1. Visit your domain
2. Test login functionality:
   - Admin: `admin@example.com` / `admin123`
   - User: `user@example.com` / `user123`
3. Verify Supabase connection is working

## Important Notes

### Security Considerations

1. **Environment Variables**: Your Supabase keys are public in the built files (this is normal for frontend apps)
2. **RLS Policies**: Make sure your Supabase Row Level Security policies are properly configured
3. **HTTPS**: Enable SSL/TLS certificate in cPanel for secure connections

### Supabase Configuration

Your app is already configured to use Supabase with these features:
- Authentication (currently using local storage)
- Database operations
- Real-time subscriptions (if needed)

### File Structure After Deployment

```
public_html/
├── index.html
├── assets/
│   ├── css files
│   └── js files
├── .htaccess
└── other static files
```

### Troubleshooting

#### Common Issues:

1. **404 Errors on Refresh**
   - Make sure `.htaccess` file is uploaded and working
   - Check if mod_rewrite is enabled on your hosting

2. **Supabase Connection Issues**
   - Verify environment variables in built files
   - Check browser console for CORS errors
   - Ensure Supabase project is active

3. **Blank Page**
   - Check browser console for JavaScript errors
   - Verify all assets are loading correctly
   - Check if the base path is correct

#### Performance Optimization:

1. **Enable Gzip Compression** (included in .htaccess)
2. **Set Cache Headers** (included in .htaccess)
3. **Optimize Images** before uploading
4. **Use CDN** if needed for better performance

### Updating Your Application

To update your deployed application:

1. Make changes to your code
2. Run `./deploy.sh` again
3. Upload the new `deployment.zip`
4. Extract and replace files

### Backup Strategy

1. **Database**: Supabase handles backups automatically
2. **Application Files**: Keep your source code in version control
3. **User Data**: Regular exports from your admin panel

## Support

If you encounter issues:

1. Check Namecheap hosting documentation
2. Verify Supabase project status
3. Check browser developer tools for errors
4. Contact Namecheap support for hosting-specific issues

## Security Best Practices

1. **Regular Updates**: Keep your dependencies updated
2. **Monitor Access**: Use Supabase dashboard to monitor usage
3. **Backup Data**: Regular exports of important data
4. **SSL Certificate**: Always use HTTPS in production