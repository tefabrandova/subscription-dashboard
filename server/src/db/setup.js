const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = process.env;

async function setupDatabase() {
  console.log('Setting up database...');
  
  // Create connection to MySQL server (without database)
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD
  });

  try {
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`Database '${DB_NAME}' created or already exists.`);
    
    // Use the database
    await connection.query(`USE \`${DB_NAME}\``);
    
    // Read migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Copy migration SQL files from supabase directory if they exist
    const supabaseMigrationsDir = path.join(__dirname, '../../../supabase/migrations');
    if (fs.existsSync(supabaseMigrationsDir)) {
      const files = fs.readdirSync(supabaseMigrationsDir);
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const content = fs.readFileSync(path.join(supabaseMigrationsDir, file), 'utf8');
          // Convert PostgreSQL syntax to MySQL
          const mysqlContent = convertToMysql(content);
          fs.writeFileSync(path.join(migrationsDir, file), mysqlContent);
        }
      }
    }
    
    // Read and execute migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split SQL by semicolons to execute multiple statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
          } catch (err) {
            console.error(`Error executing statement: ${statement}`);
            console.error(err);
          }
        }
      }
    }
    
    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

function convertToMysql(pgSql) {
  // Basic conversion from PostgreSQL to MySQL syntax
  let mysqlSql = pgSql;
  
  // Replace UUID generation
  mysqlSql = mysqlSql.replace(/gen_random_uuid\(\)/g, 'UUID()');
  
  // Replace TIMESTAMPTZ with TIMESTAMP
  mysqlSql = mysqlSql.replace(/TIMESTAMPTZ/g, 'TIMESTAMP');
  
  // Replace now() with NOW()
  mysqlSql = mysqlSql.replace(/now\(\)/g, 'NOW()');
  
  // Replace TEXT[] with TEXT
  mysqlSql = mysqlSql.replace(/TEXT\[\]/g, 'TEXT');
  
  // Replace CREATE POLICY statements (MySQL doesn't have policies)
  mysqlSql = mysqlSql.replace(/CREATE POLICY.*?;/gs, '-- MySQL does not support policies\n');
  
  // Replace ENABLE ROW LEVEL SECURITY
  mysqlSql = mysqlSql.replace(/ALTER TABLE.*?ENABLE ROW LEVEL SECURITY;/g, '-- MySQL does not support RLS\n');
  
  return mysqlSql;
}

// Run the setup
setupDatabase().catch(console.error);