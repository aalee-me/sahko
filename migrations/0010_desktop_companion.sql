CREATE TABLE companion_pairs (
 id TEXT PRIMARY KEY,
 join_hash TEXT NOT NULL UNIQUE,
 writer_hash TEXT NOT NULL,
 viewer_hash TEXT,
 join_expires INTEGER NOT NULL,
 expires INTEGER NOT NULL,
 snapshot TEXT NOT NULL DEFAULT '{}',
 updated_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL,
 ip_hash TEXT NOT NULL,
 pending_jolt TEXT
);
CREATE INDEX companion_expiry ON companion_pairs(expires);
CREATE INDEX companion_creation_ip ON companion_pairs(ip_hash,created_at);
