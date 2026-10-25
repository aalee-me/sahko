-- A rolling one-minute send cooldown, separate from anonymous thought records.
CREATE TABLE cloud_release_cooldowns (
 actor_hash TEXT PRIMARY KEY,
 last_at INTEGER NOT NULL
);
