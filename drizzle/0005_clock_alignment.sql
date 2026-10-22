ALTER TABLE rooms ADD COLUMN first_break_seconds INTEGER NOT NULL DEFAULT 300;
UPDATE rooms SET first_break_seconds=break_seconds;
