# Database Setup Instructions

## Step 1: Import the Schema

1. **Access phpMyAdmin** from your Namecheap cPanel
2. **Select your database**: `bookvfke_subscription_db`
3. **Click the "Import" tab**
4. **Choose file**: Upload the `schema.sql` file
5. **Click "Go"** to execute the import

## Step 2: Verify Tables Created

After importing, you should see these tables in your database:
- `users` (with 2 default users)
- `accounts`
- `packages`
- `customers`
- `subscriptions`
- `expenses`
- `activity_logs`
- `notifications`
- `workspace_settings`

## Step 3: Default Login Credentials

The system comes with these default users:

**Admin User:**
- Email: `admin@example.com`
- Password: `password`

**Regular User:**
- Email: `user@example.com`
- Password: `password`

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

## Step 4: Test Database Connection

Create a test file in your hosting to verify the connection:

```php
<?php
require_once 'api/config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo "✅ Database connection successful!";
    
    // Test query
    $stmt = $db->query("SELECT COUNT(*) as user_count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<br>👥 Users in database: " . $result['user_count'];
} else {
    echo "❌ Database connection failed!";
}
?>
```

## Troubleshooting

### Connection Issues
- Verify database name: `bookvfke_subscription_db`
- Verify username: `bookvfke_sub_user`
- Verify password: `h)dc8SF^gyF4`
- Ensure the database user has all privileges

### Import Issues
- Make sure you're importing into the correct database
- Check for any error messages during import
- Verify your hosting supports MySQL 5.7+ or MariaDB 10.2+

### Permission Issues
- Ensure the database user has SELECT, INSERT, UPDATE, DELETE privileges
- Check that the hosting account has sufficient resources