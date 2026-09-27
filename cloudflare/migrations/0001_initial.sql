CREATE TABLE site_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL, session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX site_events_created_at_idx ON site_events(created_at);
CREATE TABLE event_counts (event_name TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
CREATE TRIGGER site_event_insert AFTER INSERT ON site_events BEGIN
  INSERT INTO event_counts(event_name, count) VALUES(new.event_name, 1)
  ON CONFLICT(event_name) DO UPDATE SET count = count + 1;
END;
CREATE TABLE questionnaire_questions (
  id TEXT PRIMARY KEY, question_order INTEGER NOT NULL UNIQUE,
  question_kind TEXT NOT NULL DEFAULT 'scored' CHECK(question_kind IN ('scored','special')),
  question_en TEXT NOT NULL, question_th TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE questionnaire_choices (
  id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  choice_order INTEGER NOT NULL, label TEXT NOT NULL, choice_en TEXT NOT NULL, choice_th TEXT NOT NULL,
  score_b INTEGER NOT NULL DEFAULT 0, score_d INTEGER NOT NULL DEFAULT 0,
  score_s INTEGER NOT NULL DEFAULT 0, score_m INTEGER NOT NULL DEFAULT 0,
  special_action TEXT, special_url TEXT, feedback_en TEXT, feedback_th TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(question_id, choice_order)
);
CREATE TABLE invitation_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, room_key TEXT NOT NULL CHECK(room_key IN ('b','d','s','m')),
  code TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX invitation_codes_room_idx ON invitation_codes(room_key,active);
CREATE TABLE invitation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guest_name TEXT NOT NULL,
  guest_name_key TEXT NOT NULL UNIQUE,
  answered_date TEXT NOT NULL, answers TEXT NOT NULL CHECK(json_valid(answers)),
  scores TEXT NOT NULL CHECK(json_valid(scores)),
  winning_room TEXT NOT NULL CHECK(winning_room IN ('b','d','s','m')),
  invitation_code TEXT NOT NULL, session_id TEXT,
  active_play_token TEXT, active_play_session_id TEXT, active_play_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX invitation_results_room_idx ON invitation_results(winning_room);
CREATE TABLE mini_game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT, room_key TEXT NOT NULL CHECK(room_key IN ('b','d','s','m')),
  guest_name TEXT NOT NULL, click_count INTEGER NOT NULL DEFAULT 0 CHECK(click_count >= 0), session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(room_key,guest_name)
);
CREATE INDEX mini_game_scores_leaderboard_idx ON mini_game_scores(room_key,click_count DESC,updated_at ASC);
