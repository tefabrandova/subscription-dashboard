# Complete Setup Guide for Namecheap Shared Hosting

## Step 1: Set Up MySQL Database on Namecheap

### 1.1 Access cPanel
1. Log into your Namecheap account
2. Go to your hosting dashboard
3. Click on "cPanel" to access your hosting control panel

### 1.2 Create MySQL Database
1. In cPanel, find the "Databases" section
2. Click on "MySQL Databases"
3. Create a new database:
   - Database Name: `subscription_management` (or your preferred name)
   - Click "Create Database"

### 1.3 Create Database User
1. In the same MySQL Databases page, scroll to "MySQL Users"
2. Create a new user:
   - Username: `sub_admin` (or your preferred username)
   - Password: Create a strong password
   - Click "Create User"

### 1.4 Add User to Database
1. Scroll to "Add User to Database"
2. Select your user and database
3. Grant "ALL PRIVILEGES"
4. Click "Add"

### 1.5 Import Database Schema
1. In cPanel, go to "phpMyAdmin"
2. Select your database
3. Click "Import" tab
4. Upload the `database/schema.sql` file from your project
5. Click "Go" to execute

## Step 2: Configure Database Connection

### 2.1 Update Database Configuration
Edit `api/config/database.php` with your database details:

```php
private $host = 'localhost';
private $db_name = 'your_actual_database_name';
private $username = 'your_actual_username';
private $password = 'your_actual_password';
```

**Important:** Replace these with the actual values from Step 1.

## Step 3: Upload Files to Namecheap

### 3.1 Build Your Project
Run these commands in your project directory:

```bash
npm run build
```

### 3.2 Upload via cPanel File Manager
1. In cPanel, open "File Manager"
2. Navigate to `public_html` folder
3. Upload your built files:
   - Upload all files from the `dist` folder to `public_html`
   - Upload the entire `api` folder to `public_html/api`
   - Upload the `database` folder to `public_html/database` (for reference)

### 3.3 File Structure After Upload
Your `public_html` should look like this:
```
public_html/
├── index.html
├── assets/
│   ├── css files
│   └── js files
├── api/
│   ├── config/
│   ├── auth/
│   ├── accounts/
│   ├── packages/
│   ├── customers/
│   └── activity/
├── database/
│   └── schema.sql
└── .htaccess
```

## Step 4: Set File Permissions

### 4.1 Set PHP File Permissions
1. In File Manager, select all PHP files in the `api` folder
2. Right-click and choose "Permissions"
3. Set permissions to `644` for PHP files
4. Set permissions to `755` for directories

## Step 5: Test Your Application

### 5.1 Test Database Connection
1. Create a test file `public_html/test_db.php`:

```php
<?php
require_once 'api/config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo "Database connection successful!";
} else {
    echo "Database connection failed!";
}
?>
```

2. Visit `https://yourdomain.com/test_db.php`
3. You should see "Database connection successful!"
4. Delete the test file after verification

### 5.2 Test Your Application
1. Visit your domain: `https://yourdomain.com`
2. Try logging in with default credentials:
   - Admin: `admin@example.com` / `password`
   - User: `user@example.com` / `password`

## Step 6: Security Configuration

### 6.1 Change Default Passwords
1. Access phpMyAdmin
2. Go to your `users` table
3. Update the password hashes for default users:

```sql
UPDATE users SET password = '$2y$10$your_new_hash_here' WHERE email = 'admin@example.com';
```

Use an online bcrypt generator to create password hashes.

### 6.2 Secure Your Database
1. Remove the test file if you created one
2. Ensure the `database` folder is not accessible via web
3. Consider moving sensitive files outside `public_html`

## Step 7: Configure Domain and SSL

### 7.1 Point Domain to Hosting
1. In Namecheap dashboard, go to "Domain List"
2. Click "Manage" next to your domain
3. Set nameservers to Namecheap hosting nameservers

### 7.2 Enable SSL Certificate
1. In cPanel, go to "SSL/TLS"
2. Enable "Let's Encrypt SSL" (usually free)
3. Force HTTPS redirects

## Step 8: Final Testing

### 8.1 Test All Features
1. **Login/Logout**: Test with both admin and user accounts
2. **Accounts**: Create, edit, delete accounts
3. **Packages**: Create, edit, delete packages
4. **Customers**: Create, edit, delete customers
5. **Activity Logs**: Verify actions are being logged

### 8.2 Test on Different Devices
- Desktop browsers
- Mobile devices
- Different screen sizes

## Troubleshooting Common Issues

### Issue 1: Database Connection Failed
- **Solution**: Double-check database credentials in `api/config/database.php`
- Verify database name, username, and password are correct

### Issue 2: 500 Internal Server Error
- **Solution**: Check PHP error logs in cPanel
- Ensure file permissions are correct (644 for files, 755 for directories)

### Issue 3: CORS Errors
- **Solution**: Verify `api/config/cors.php` is included in all API files
- Check that `.htaccess` file is uploaded and working

### Issue 4: Login Not Working
- **Solution**: Check that the `users` table has data
- Verify password hashing is working correctly

### Issue 5: API Endpoints Not Found
- **Solution**: Ensure `.htaccess` file is in the root directory
- Check that mod_rewrite is enabled on your hosting

## Maintenance and Updates

### Regular Backups
1. **Database**: Use phpMyAdmin to export your database regularly
2. **Files**: Download your `public_html` folder periodically

### Updating Your Application
1. Make changes to your local development environment
2. Run `npm run build`
3. Upload new files to replace old ones
4. Test thoroughly

### Monitoring
1. Check error logs regularly in cPanel
2. Monitor database size and performance
3. Keep track of user activity through activity logs

## Support Resources

- **Namecheap Support**: Available 24/7 for hosting issues
- **PHP Documentation**: For backend development questions
- **MySQL Documentation**: For database-related issues

Your subscription management system should now be fully operational on Namecheap shared hosting!