-- scripts/init-db.sql

-- Create database if not exists (already done by POSTGRES_DB env var)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;

-- Switch to chat_db
\c chat_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chat_user;

-- Create indexes for better performance
-- Note: Prisma will create tables via migrations