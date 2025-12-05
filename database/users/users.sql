-- ================================================
-- DATABASE: axis-five (Supabase uses one DB only)
-- ================================================

-- Create ENUM types for role and status
CREATE TYPE user_role AS ENUM ('admin', 'customer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

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
  SELECT COALESCE(MAX(id), 0) + 1
  INTO next_seq
  FROM users
  WHERE role = NEW.role;

  -- Format: ADM-00001 or CST-00001
  NEW.user_id := prefix || '-' || LPAD(next_seq::text, 5, '0');

  -- Updated_at handling
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGER
-- ================================================

DROP TRIGGER IF EXISTS before_insert_users ON users;

CREATE TRIGGER before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_user_id();

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
