export type PromiseStatus =
  | "open"
  | "needs_clarification"
  | "done"
  | "snoozed"
  | "dismissed"
  | "drafted"
  | "closed_loop";

export interface CommitmentCandidate {
  action: string;
  rawAction: string;
  dueAt: Date | null;
  confidence: number;
  reason: string;
  needsClarification: boolean;
}

export interface PromiseRecord {
  id: string;
  sourceMessageGuid: string;
  sourceChatId: string;
  sourceChatName: string | null;
  counterparty: string;
  commitmentText: string;
  normalizedAction: string;
  dueAt: string | null;
  confidence: number;
  status: PromiseStatus;
  needsClarification: number;
  reminderSentAt: string | null;
  draftedReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromiseEventRecord {
  id: string;
  promiseId: string;
  kind: string;
  payload: string | null;
  createdAt: string;
}
