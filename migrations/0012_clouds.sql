-- Optional anonymous text-only public space. No private thought IDs or voice data.
CREATE TABLE cloud_thoughts (
 id TEXT PRIMARY KEY,
 owner_hash TEXT NOT NULL,
 nonce TEXT NOT NULL,
 text TEXT NOT NULL CHECK(length(text) BETWEEN 1 AND 160),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 UNIQUE(owner_hash,nonce)
);
CREATE INDEX cloud_thoughts_expiry ON cloud_thoughts(expires_at,created_at);
CREATE INDEX cloud_thoughts_owner ON cloud_thoughts(owner_hash,created_at);
CREATE TABLE cloud_resonance (
 thought_id TEXT NOT NULL REFERENCES cloud_thoughts(id) ON DELETE CASCADE,
 actor_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(thought_id,actor_hash)
);
CREATE INDEX cloud_resonance_actor ON cloud_resonance(actor_hash,created_at);
