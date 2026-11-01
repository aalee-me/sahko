CREATE TABLE room_removals(room_id TEXT NOT NULL REFERENCES rooms(id),owner_id TEXT NOT NULL,removed_at INTEGER NOT NULL,PRIMARY KEY(room_id,owner_id));
