ALTER TABLE rooms ADD COLUMN title TEXT NOT NULL DEFAULT '';
ALTER TABLE rooms ADD COLUMN password_hash TEXT;
CREATE TABLE room_invites (id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id), sender TEXT NOT NULL, recipient TEXT NOT NULL, created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', UNIQUE(room_id,recipient));
CREATE INDEX room_invites_recipient ON room_invites(recipient,status);
CREATE TABLE room_access_attempts (room_id TEXT NOT NULL, owner_id TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, last_attempt INTEGER NOT NULL, PRIMARY KEY(room_id,owner_id));
