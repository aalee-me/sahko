CREATE TABLE IF NOT EXISTS companion_phone_events (
 pair_id TEXT NOT NULL REFERENCES companion_pairs(id) ON DELETE CASCADE,
 id TEXT NOT NULL,
 session_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('enabled','disabled','pickup')),
 at INTEGER NOT NULL,
 received_at INTEGER NOT NULL,
 PRIMARY KEY(pair_id,id)
);
CREATE INDEX IF NOT EXISTS companion_phone_events_session ON companion_phone_events(pair_id,session_id,at);
