ALTER TABLE rooms ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE rooms ADD COLUMN host_id TEXT;
CREATE TABLE profiles (owner_id TEXT PRIMARY KEY, alias TEXT NOT NULL);
CREATE TABLE friendships (requester TEXT NOT NULL, target TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', PRIMARY KEY(requester,target));
UPDATE rooms SET phase_ends_at=CAST(strftime('%s','now') AS INTEGER)*1000+remaining*1000, paused=0 WHERE paused=1;
