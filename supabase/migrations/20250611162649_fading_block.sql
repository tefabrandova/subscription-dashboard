-- Subscription Management System Database Schema
-- MySQL Version

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create accounts table
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` varchar(50) NOT NULL PRIMARY KEY,
  `type` enum('subscription','purchase') NOT NULL,
  `name` varchar(255) NOT NULL,
  `details` json DEFAULT NULL,
  `subscription_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `price` json DEFAULT NULL,
  `linked_packages` int(11) DEFAULT 0,
  `user_id` varchar(50) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create packages table
CREATE TABLE IF NOT EXISTS `packages` (
  `id` varchar(50) NOT NULL PRIMARY KEY,
  `account_id` varchar(50) NOT NULL,
  `type` enum('subscription','purchase') NOT NULL,
  `name` varchar(255) NOT NULL,
  `details` json DEFAULT NULL,
  `price` json DEFAULT NULL,
  `subscribed_customers` int(11) DEFAULT 0,
  `user_id` varchar(50) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_account_id` (`account_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create customers table
CREATE TABLE IF NOT EXISTS `customers` (
  `id` varchar(50) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `user_id` varchar(50) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` varchar(50) NOT NULL PRIMARY KEY,
  `customer_id` varchar(50) NOT NULL,
  `package_id` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `duration` int(11) NOT NULL,
  `status` enum('active','expired','sold') NOT NULL DEFAULT 'active',
  `user_id` varchar(50) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_package_id` (`package_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create expenses table
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` varchar(50) NOT NULL PRIMARY KEY,
  `date` date NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_date` (`date`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` varchar(50) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` varchar(50) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `object_type` varchar(50) NOT NULL,
  `object_id` varchar(50) NOT NULL,
  `object_name` varchar(255) NOT NULL,
  `details` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action_type` (`action_type`),
  INDEX `idx_object_type` (`object_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` varchar(50) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `type` enum('account_expiry','package_expiry','system') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `read` boolean DEFAULT FALSE,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_read` (`read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create workspace_settings table
CREATE TABLE IF NOT EXISTS `workspace_settings` (
  `id` varchar(50) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `logo` longtext DEFAULT NULL,
  `theme_color` varchar(7) DEFAULT '#8a246c',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default users with hashed passwords
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
('admin-1', 'Admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW()),
('user-1', 'User', 'user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', NOW())
ON DUPLICATE KEY UPDATE 
`name` = VALUES(`name`),
`role` = VALUES(`role`);

-- Insert default workspace settings
INSERT INTO `workspace_settings` (`id`, `theme_color`) VALUES
('default', '#8a246c')
ON DUPLICATE KEY UPDATE 
`theme_color` = VALUES(`theme_color`);

-- Add foreign key constraints (optional, but recommended)
-- Note: Uncomment these if you want strict referential integrity

-- ALTER TABLE `accounts` ADD CONSTRAINT `fk_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `packages` ADD CONSTRAINT `fk_packages_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `packages` ADD CONSTRAINT `fk_packages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `customers` ADD CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_subscriptions_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_subscriptions_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `expenses` ADD CONSTRAINT `fk_expenses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `activity_logs` ADD CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
-- ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;