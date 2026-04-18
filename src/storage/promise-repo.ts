import type { Database } from "bun:sqlite";
import type { PromiseRecord } from "../domain/promise.ts";

export class PromiseRepo {
  constructor(private readonly db: Database) {}

  insert(record: PromiseRecord) {
    this.db
      .query(
        `INSERT INTO promises (
          id, source_message_guid, source_chat_id, source_chat_name, counterparty,
          commitment_text, normalized_action, due_at, confidence, status,
          needs_clarification, reminder_sent_at, drafted_reply, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.sourceMessageGuid,
        record.sourceChatId,
        record.sourceChatName,
        record.counterparty,
        record.commitmentText,
        record.normalizedAction,
        record.dueAt,
        record.confidence,
        record.status,
        record.needsClarification,
        record.reminderSentAt,
        record.draftedReply,
        record.createdAt,
        record.updatedAt,
      );
  }

  existsBySourceMessageGuid(sourceMessageGuid: string) {
    const row = this.db
      .query("SELECT 1 FROM promises WHERE source_message_guid = ? LIMIT 1")
      .get(sourceMessageGuid);

    return Boolean(row);
  }

  getOpenPromises() {
    return this.db
      .query(
        `SELECT * FROM promises
         WHERE status IN ('open', 'needs_clarification', 'snoozed', 'drafted')
         ORDER BY COALESCE(due_at, created_at) ASC`,
      )
      .all() as PromiseRecord[];
  }

  getPromiseById(id: string) {
    return this.db
      .query("SELECT * FROM promises WHERE id = ? LIMIT 1")
      .get(id) as PromiseRecord | null;
  }

  getLatestOpenPromise() {
    return this.db
      .query(
        `SELECT * FROM promises
         WHERE status IN ('open', 'needs_clarification', 'snoozed', 'drafted')
         ORDER BY updated_at DESC
         LIMIT 1`,
      )
      .get() as PromiseRecord | null;
  }

  getDuePromiseIds(beforeIso: string) {
    return this.db
      .query(
        `SELECT id FROM promises
         WHERE status IN ('open', 'snoozed')
           AND due_at IS NOT NULL
           AND reminder_sent_at IS NULL
           AND due_at <= ?
         ORDER BY due_at ASC`,
      )
      .all(beforeIso) as { id: string }[];
  }

  updateStatus(id: string, status: PromiseRecord["status"], dueAt?: string | null) {
    this.db
      .query(
        `UPDATE promises
         SET status = ?,
             due_at = COALESCE(?, due_at),
             updated_at = ?
         WHERE id = ?`,
      )
      .run(status, dueAt ?? null, new Date().toISOString(), id);
  }

  markReminderSent(id: string) {
    this.db
      .query(
        `UPDATE promises
         SET reminder_sent_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(new Date().toISOString(), new Date().toISOString(), id);
  }

  saveDraft(id: string, draft: string) {
    this.db
      .query(
        `UPDATE promises
         SET drafted_reply = ?, status = 'drafted', updated_at = ?
         WHERE id = ?`,
      )
      .run(draft, new Date().toISOString(), id);
  }

  clearReminder(id: string) {
    this.db
      .query(
        `UPDATE promises
         SET reminder_sent_at = NULL, updated_at = ?
         WHERE id = ?`,
      )
      .run(new Date().toISOString(), id);
  }

  addEvent(promiseId: string, kind: string, payload?: unknown) {
    this.db
      .query(
        `INSERT INTO promise_events (id, promise_id, kind, payload, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        crypto.randomUUID(),
        promiseId,
        kind,
        payload === undefined ? null : JSON.stringify(payload),
        new Date().toISOString(),
      );
  }
}
