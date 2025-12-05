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
-- TRIGGER FUNCTION: Archive user instead of delete
-- ================================================

CREATE OR REPLACE FUNCTION archive_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the deleted record into archive
  INSERT INTO users_archived (
    user_id, first_name, last_name, email, username, 
    password, role, status, created_at, updated_at, 
    last_login, original_id, archived_at
  ) VALUES (
    OLD.user_id, OLD.first_name, OLD.last_name, OLD.email, 
    OLD.username, OLD.password, OLD.role, OLD.status, 
    OLD.created_at, OLD.updated_at, OLD.last_login, 
    OLD.id, NOW()
  );
  
  -- Allow the deletion to proceed
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
  
  -- Update archived_by and reason before deletion
  -- (We'll store these in a temporary way via a separate update to archived table)
  DELETE FROM users WHERE user_id = p_user_id;
  
  -- Update the just-archived record with metadata
  UPDATE users_archived 
  SET 
    archived_by = p_archived_by,
    archive_reason = p_reason
  WHERE user_id = p_user_id 
    AND id = (SELECT MAX(id) FROM users_archived WHERE user_id = p_user_id);
  
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
  
  -- Restore to active users table
  INSERT INTO users (
    user_id, first_name, last_name, email, username,
    password, role, status, created_at, updated_at, last_login
  ) VALUES (
    v_archived_record.user_id,
    v_archived_record.first_name,
    v_archived_record.last_name,
    v_archived_record.email,
    v_archived_record.username,
    v_archived_record.password,
    v_archived_record.role,
    v_archived_record.status,
    v_archived_record.created_at,
    NOW(), -- Update the updated_at
    v_archived_record.last_login
  );
  
  -- Optionally, you can delete from archive or keep it for history
  DELETE FROM users_archived WHERE id = v_archived_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

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