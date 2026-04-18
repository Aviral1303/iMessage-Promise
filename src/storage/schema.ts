export const schema = `
CREATE TABLE IF NOT EXISTS promises (
  id TEXT PRIMARY KEY,
  source_message_guid TEXT NOT NULL UNIQUE,
  source_chat_id TEXT NOT NULL,
  source_chat_name TEXT,
  counterparty TEXT NOT NULL,
  commitment_text TEXT NOT NULL,
  normalized_action TEXT NOT NULL,
  due_at TEXT,
  confidence REAL NOT NULL,
  status TEXT NOT NULL,
  needs_clarification INTEGER NOT NULL DEFAULT 0,
  reminder_sent_at TEXT,
  drafted_reply TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS promise_events (
  id TEXT PRIMARY KEY,
  promise_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (promise_id) REFERENCES promises(id)
);

CREATE INDEX IF NOT EXISTS idx_promises_status_due_at
ON promises(status, due_at);
`;
