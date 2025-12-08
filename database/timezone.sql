-- Set database timezone to Manila
ALTER DATABASE postgres
SET
    timezone TO 'Asia/Manila';

-- Verify
SHOW timezone;

SELECT
    NOW () as current_time;