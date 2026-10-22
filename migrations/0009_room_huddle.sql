CREATE TABLE voice_members (member_id TEXT PRIMARY KEY, room_id TEXT NOT NULL, session_id TEXT NOT NULL, muted INTEGER NOT NULL DEFAULT 0, last_seen INTEGER NOT NULL);
CREATE INDEX voice_room_presence ON voice_members(room_id,last_seen);
CREATE TABLE huddle_signals (id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT NOT NULL, sender TEXT NOT NULL, sender_session TEXT NOT NULL, recipient TEXT NOT NULL, recipient_session TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX huddle_recipient ON huddle_signals(recipient,id);
CREATE TABLE room_chat (id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT NOT NULL, sender TEXT NOT NULL, owner_id TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX room_chat_trail ON room_chat(room_id,id);
ALTER TABLE rooms ADD COLUMN first_focus_seconds INTEGER;
