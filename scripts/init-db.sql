-- scripts/init-db.sql

-- Create databases
CREATE DATABASE conversation_db;

-- Create extensions in chat_db
\c chat_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges for chat_db
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;
GRANT ALL ON SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chat_user;

-- Switch to conversation_db and set it up
\c conversation_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges for conversation_db
GRANT ALL PRIVILEGES ON DATABASE conversation_db TO chat_user;
GRANT ALL ON SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chat_user;
