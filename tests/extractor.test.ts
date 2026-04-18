import { describe, expect, test } from "bun:test";
import { extractCommitment } from "../src/agent/extractor.ts";

describe("extractCommitment", () => {
  test("finds explicit promise with time", () => {
    const result = extractCommitment({
      guid: "m1",
      id: "m1",
      text: "I'll send that tonight",
      sender: "+15555555555",
      senderName: "Alex",
      chatId: "chat-1",
      isGroupChat: false,
      service: "iMessage",
      isRead: true,
      isFromMe: true,
      isReaction: false,
      reactionType: null,
      isReactionRemoval: false,
      associatedMessageGuid: null,
      attachments: [],
      date: new Date("2026-04-18T10:00:00Z"),
    });

    expect(result?.action).toBe("send that");
    expect(result?.dueAt).toBeInstanceOf(Date);
    expect(result?.needsClarification).toBe(false);
  });

  test("needs clarification when no time", () => {
    const result = extractCommitment({
      guid: "m2",
      id: "m2",
      text: "I'll review the deck",
      sender: "+15555555555",
      senderName: "Alex",
      chatId: "chat-1",
      isGroupChat: false,
      service: "iMessage",
      isRead: true,
      isFromMe: true,
      isReaction: false,
      reactionType: null,
      isReactionRemoval: false,
      associatedMessageGuid: null,
      attachments: [],
      date: new Date("2026-04-18T10:00:00Z"),
    });

    expect(result?.action).toBe("review the deck");
    expect(result?.dueAt).toBeNull();
    expect(result?.needsClarification).toBe(true);
  });
});
