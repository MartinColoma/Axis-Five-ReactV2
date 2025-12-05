-- ================================================
-- DATABASE: axis-five (Supabase uses one DB only)
-- ================================================

-- Create ENUM types for role and status
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ================================================
-- TABLE: users
-- ================================================

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id              BIGSERIAL PRIMARY KEY,
  user_id         VARCHAR(20) UNIQUE NOT NULL,     -- e.g., ADM-00001
  first_name      VARCHAR(50) NOT NULL,
  last_name       VARCHAR(50) NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'customer',
  status          user_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login      TIMESTAMP DEFAULT NULL
);

-- ================================================
-- TRIGGER FUNCTION: auto-generate formatted user_id
-- ================================================

CREATE OR REPLACE FUNCTION generate_user_id()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INT;
  prefix TEXT;
BEGIN
  -- Select prefix
  IF NEW.role = 'admin' THEN
    prefix := 'ADM';
  ELSE
    prefix := 'CST';
  END IF;

  -- Determine next sequence number by role
  SELECT COALESCE(MAX(CAST(SPLIT_PART(user_id, '-', 2) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM users
  WHERE role = NEW.role AND user_id IS NOT NULL;

  -- Format: ADM-00001 or CST-00001
  NEW.user_id := prefix || '-' || LPAD(next_seq::text, 5, '0');

  -- Updated_at handling
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGER: Auto-generate user_id on INSERT
-- ================================================

DROP TRIGGER IF EXISTS before_insert_users ON users;

CREATE TRIGGER before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_user_id();

-- ================================================
-- TABLE: users_archived
-- ================================================

DROP TABLE IF EXISTS users_archived CASCADE;

CREATE TABLE users_archived (
  id              BIGSERIAL PRIMARY KEY,
  user_id         VARCHAR(20) NOT NULL,
  first_name      VARCHAR(50) NOT NULL,
  last_name       VARCHAR(50) NOT NULL,
  email           VARCHAR(100) NOT NULL,
  username        VARCHAR(50) NOT NULL,
  password        VARCHAR(255) NOT NULL,
  role            user_role NOT NULL,
  status          user_status NOT NULL,
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL,
  last_login      TIMESTAMP,
  -- Archive metadata
  archived_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  archived_by     VARCHAR(50),                      -- Username who archived
  archive_reason  TEXT,                             -- Optional reason
  original_id     BIGINT NOT NULL                   -- Reference to original id
);

-- Index for faster searches
CREATE INDEX idx_users_archived_user_id ON users_archived(user_id);
CREATE INDEX idx_users_archived_email ON users_archived(email);
CREATE INDEX idx_users_archived_archived_at ON users_archived(archived_at);

-- ================================================
-- TRIGGER FUNCTION: Archive user with metadata
-- ================================================

CREATE OR REPLACE FUNCTION archive_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the deleted record into archive with metadata from context
  INSERT INTO users_archived (
    user_id, first_name, last_name, email, username, 
    password, role, status, created_at, updated_at, 
    last_login, original_id, archived_at, archived_by, archive_reason
  ) VALUES (
    OLD.user_id, OLD.first_name, OLD.last_name, OLD.email, 
    OLD.username, OLD.password, OLD.role, OLD.status, 
    OLD.created_at, OLD.updated_at, OLD.last_login, 
    OLD.id, NOW(),
    -- Get metadata from session variables (set before DELETE)
    current_setting('app.archived_by', true),
    current_setting('app.archive_reason', true)
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGER: Auto-archive on DELETE
-- ================================================

DROP TRIGGER IF EXISTS before_delete_users ON users;

CREATE TRIGGER before_delete_users
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION archive_user();

-- ================================================
-- HELPER FUNCTION: Soft delete (archive) a user
-- ================================================

CREATE OR REPLACE FUNCTION soft_delete_user(
  p_user_id VARCHAR(20),
  p_archived_by VARCHAR(50) DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE user_id = p_user_id)
  INTO v_exists;
  
  IF NOT v_exists THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;
  
  -- Set session variables for trigger to use
  PERFORM set_config('app.archived_by', COALESCE(p_archived_by, 'system'), true);
  PERFORM set_config('app.archive_reason', COALESCE(p_reason, 'No reason provided'), true);
  
  -- Delete triggers the archive
  DELETE FROM users WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- HELPER FUNCTION: Restore archived user
-- ================================================

CREATE OR REPLACE FUNCTION restore_user(p_user_id VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
  v_archived_record users_archived%ROWTYPE;
  v_exists BOOLEAN;
  v_next_id BIGINT;
BEGIN
  -- Check if user is already active
  SELECT EXISTS(SELECT 1 FROM users WHERE user_id = p_user_id)
  INTO v_exists;
  
  IF v_exists THEN
    RAISE EXCEPTION 'User % is already active', p_user_id;
  END IF;
  
  -- Get the most recent archived record
  SELECT * INTO v_archived_record
  FROM users_archived
  WHERE user_id = p_user_id
  ORDER BY archived_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No archived record found for user %', p_user_id;
  END IF;
  
  -- Get next ID for the users table
  SELECT COALESCE(MAX(id), 0) + 1 INTO v_next_id FROM users;
  
  -- Restore to active users table with new ID
  INSERT INTO users (
    id, user_id, first_name, last_name, email, username,
    password, role, status, created_at, updated_at, last_login
  ) VALUES (
    v_next_id,
    v_archived_record.user_id,
    v_archived_record.first_name,
    v_archived_record.last_name,
    v_archived_record.email,
    v_archived_record.username,
    v_archived_record.password,
    v_archived_record.role,
    'active', -- Always restore as active
    v_archived_record.created_at,
    NOW(),
    v_archived_record.last_login
  );
  
  -- Update sequence to match
  PERFORM setval('users_id_seq', v_next_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- SAMPLE DATA
-- ================================================

INSERT INTO users (
  first_name, last_name, email, username, password,
  role, status, created_at, updated_at, last_login
) VALUES
(
  'Earl', 'Morphy', 'morphy@example.com', 'morphy',
  '$2y$10$0DxH4dwI63S6YqW4lIAOke00yRUq9sIeCl6g9HANbWo1zDhla7.hy',
  'customer', 'active', NOW(), NOW(), NULL
),
(
  'Admin', 'User', 'admin@example.com', 'admin',
  '$2y$10$0DxH4dwI63S6YqW4lIAOke00yRUq9sIeCl6g9HANbWo1zDhla7.hy',
  'admin', 'active', NOW(), NOW(), NULL
);

-- ================================================
-- USAGE EXAMPLES
-- ================================================

-- Archive a user with metadata:
-- SELECT soft_delete_user('CST-00001', 'admin', 'User requested account deletion');

-- Or simple DELETE (auto-archives):
-- DELETE FROM users WHERE user_id = 'CST-00001';

-- Restore a user:
-- SELECT restore_user('CST-00001');

-- View archived users:
-- SELECT * FROM users_archived ORDER BY archived_at DESC;