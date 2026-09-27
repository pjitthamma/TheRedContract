-- The original production dataset contains duplicate case-folded names.
-- Preserve every historical row. New registrations use an atomic INSERT ... SELECT
-- WHERE NOT EXISTS. Login selects exactly one row by name + room + invitation code.
CREATE TABLE invitation_results_preserved (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guest_name TEXT NOT NULL,
  guest_name_key TEXT NOT NULL,
  answered_date TEXT NOT NULL, answers TEXT NOT NULL CHECK(json_valid(answers)),
  scores TEXT NOT NULL CHECK(json_valid(scores)),
  winning_room TEXT NOT NULL CHECK(winning_room IN ('b','d','s','m')),
  invitation_code TEXT NOT NULL, session_id TEXT,
  active_play_token TEXT, active_play_session_id TEXT, active_play_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO invitation_results_preserved SELECT * FROM invitation_results;
DROP TABLE invitation_results;
ALTER TABLE invitation_results_preserved RENAME TO invitation_results;
CREATE INDEX invitation_results_name_idx ON invitation_results(guest_name_key);
CREATE INDEX invitation_results_room_idx ON invitation_results(winning_room);
