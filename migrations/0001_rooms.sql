CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, phase TEXT NOT NULL DEFAULT 'focus', phase_ends_at INTEGER NOT NULL, remaining INTEGER NOT NULL DEFAULT 1500, paused INTEGER NOT NULL DEFAULT 0, sprint INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id), owner_id TEXT NOT NULL, client_hash TEXT NOT NULL, name TEXT NOT NULL, task TEXT NOT NULL DEFAULT '', drift REAL NOT NULL DEFAULT 0, last_seen INTEGER NOT NULL, UNIQUE(room_id,owner_id,client_hash));
CREATE INDEX IF NOT EXISTS members_room_seen ON members(room_id,last_seen);
CREATE TABLE IF NOT EXISTS jolts (id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT NOT NULL REFERENCES rooms(id), sender_id TEXT NOT NULL, target_id TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS jolts_room_id ON jolts(room_id,id);
CREATE INDEX IF NOT EXISTS jolts_sender_time ON jolts(sender_id,created_at);
