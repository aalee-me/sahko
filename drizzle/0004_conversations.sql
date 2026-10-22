CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT NOT NULL, recipient TEXT NOT NULL, sender_member TEXT NOT NULL, sender_name TEXT NOT NULL, room_id TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX messages_recipient ON messages(recipient,id);
CREATE INDEX messages_sender ON messages(sender,created_at);
