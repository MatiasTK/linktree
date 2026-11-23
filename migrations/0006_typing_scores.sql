-- Public leaderboard for the /type typing test
CREATE TABLE IF NOT EXISTS typing_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('time', 'words')),
    mode_value INTEGER NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'es')),
    wpm REAL NOT NULL,
    raw REAL NOT NULL,
    accuracy REAL NOT NULL,
    consistency REAL NOT NULL,
    chars_correct INTEGER NOT NULL,
    chars_incorrect INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    ip_hash TEXT NOT NULL,
    token_nonce TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
);

-- Leaderboard lookups: one board per mode / length / language, best first
CREATE INDEX IF NOT EXISTS idx_typing_scores_board
    ON typing_scores(mode, mode_value, language, wpm DESC);

-- Rate limiting by submitter
CREATE INDEX IF NOT EXISTS idx_typing_scores_ip
    ON typing_scores(ip_hash, created_at);
