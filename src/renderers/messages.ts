import type { PromiseRecord } from "../domain/promise.ts";

export function formatPromiseLine(record: PromiseRecord) {
  const due = record.dueAt ? ` due ${new Date(record.dueAt).toLocaleString()}` : "";
  return `${shortId(record.id)}  ${record.counterparty}: ${record.normalizedAction}${due}`;
}

export function formatReminder(record: PromiseRecord) {
  const due = record.dueAt
    ? new Date(record.dueAt).toLocaleString()
    : "soon";

  return [
    `[Kept] You told ${record.counterparty} you would ${record.normalizedAction}.`,
    `Due: ${due}`,
    `Reply: done ${shortId(record.id)} | snooze 1h ${shortId(record.id)} | draft update ${shortId(record.id)}`,
  ].join("\n");
}

export function formatCapture(record: PromiseRecord) {
  const due = record.dueAt
    ? new Date(record.dueAt).toLocaleString()
    : "time missing";

  return `[Kept] Caught promise ${shortId(record.id)}: ${record.normalizedAction} for ${record.counterparty}. Due: ${due}`;
}

export function formatDraft(record: PromiseRecord, draft: string) {
  return [
    `[Kept] Draft for ${record.counterparty}:`,
    draft,
    `Reply: send it ${shortId(record.id)} | snooze 1h ${shortId(record.id)} | done ${shortId(record.id)}`,
  ].join("\n");
}

export function shortId(id: string) {
  return id.slice(0, 6);
}
