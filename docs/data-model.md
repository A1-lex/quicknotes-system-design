# QuickNotes Data Model

## Entities

| Table | Column | Type | Key |
|---|---|---|---|
| users | id | INTEGER | primary key |
| users | email | TEXT | unique, not null |
| users | name | TEXT | not null |
| users | created_at | TEXT | not null |
| notes | id | INTEGER | primary key |
| notes | user_id | INTEGER | foreign key to users(id) |
| notes | title | TEXT | not null, max 100 characters |
| notes | body | TEXT | optional |
| notes | created_at | TEXT | not null |
| tags | id | INTEGER | primary key |
| tags | name | TEXT | unique, not null |
| note_tags | note_id | INTEGER | foreign key to notes(id), part of primary key |
| note_tags | tag_id | INTEGER | foreign key to tags(id), part of primary key |

## Relationships

- **users to notes is one-to-many.** One user owns many notes, but each note belongs to exactly one user, so `notes.user_id` is a foreign key.
- **notes to tags is many-to-many.** One note can have many tags, and one tag can be used on many notes.
- **Why note_tags exists.** A single column cannot hold a list of tags without becoming hard to search and update. The join table `note_tags` stores one row per note and tag pair. Its primary key `(note_id, tag_id)` also stops the same tag being attached to the same note twice.

## CREATE TABLE statements

```sql
CREATE TABLE users (
  id         INTEGER PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  title      TEXT NOT NULL CHECK (length(title) <= 100),
  body       TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags (id)  ON DELETE CASCADE
);
```

Deleting a user deletes their notes, and deleting a note or tag removes its links in `note_tags`, so no orphan rows are left behind.

## Example queries

```sql
-- 1. A user's notes, newest first (GET /notes)
SELECT id, title, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 10;

-- 2. Notes that have the tag "urgent" (GET /notes?tag=urgent), using JOINs
SELECT notes.id, notes.title
FROM notes
JOIN note_tags ON note_tags.note_id = notes.id
JOIN tags      ON tags.id = note_tags.tag_id
WHERE notes.user_id = 1
  AND tags.name = 'urgent';

-- 3. How many notes use each tag
SELECT tags.name, COUNT(note_tags.note_id) AS note_count
FROM tags
LEFT JOIN note_tags ON note_tags.tag_id = tags.id
GROUP BY tags.id, tags.name;
```

## Index

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);
```

**Reason:** `GET /notes` always asks for one user's notes, newest first. Without this index the database scans every row in `notes` and then sorts them. With it, the rows are already grouped by user and in date order, so the query reads only that user's newest rows. The cost is slightly slower inserts and a little extra storage, which is a good trade because notes are read far more often than they are written. The primary key on `note_tags` already speeds up lookups by note. A second index on `note_tags (tag_id)` would help the tag filter at larger scale.

## SQL or NoSQL

I would choose SQL. QuickNotes data is structured and connected: users own notes, and notes link to tags in a many-to-many relationship. The questions the API asks, such as "all urgent notes for this user", are joins, which SQL handles directly. SQL also enforces the rules for us: unique emails, no duplicate tag on a note, no note without an owner, and cascading deletes. Transactions keep multi-step changes safe, for example creating a note and attaching its tags together, or neither. A document database would suit notes with no fixed shape, but here the shape is fixed and the relationships matter, so SQL is the better fit.
