-- Rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);

-- Index for faster queries by IP
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);
