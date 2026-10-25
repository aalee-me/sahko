-- Released thoughts have no author/session key. Erase legacy ownership links.
DROP INDEX IF EXISTS cloud_thoughts_owner;
ALTER TABLE cloud_thoughts RENAME COLUMN owner_hash TO release_key;
UPDATE cloud_thoughts SET release_key=lower(hex(randomblob(32))),nonce=lower(hex(randomblob(16)));
-- Short-lived abuse counters have no thought IDs or text and cannot identify releases.
CREATE TABLE cloud_release_windows (
 actor_hash TEXT NOT NULL,
 window_start INTEGER NOT NULL,
 period INTEGER NOT NULL,
 hits INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(actor_hash,window_start,period)
);
