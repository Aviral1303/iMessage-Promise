import * as chrono from "chrono-node";
import type { Message } from "@photon-ai/imessage-kit";
import type { CommitmentCandidate } from "../domain/promise.ts";

const commitmentPatterns = [
  /\bi(?:'ll| will)\s+(?<action>[^.!?]+)/i,
  /\bi can\s+(?<action>[^.!?]+)/i,
  /\blet me\s+(?<action>[^.!?]+)/i,
];

const weakActions = ["see", "check", "look", "think", "try", "maybe"];

export function extractCommitment(message: Message): CommitmentCandidate | null {
  if (!message.text || !message.isFromMe || message.isReaction) {
    return null;
  }

  const normalizedText = message.text.replace(/\s+/g, " ").trim();
  if (normalizedText.length < 8) {
    return null;
  }

  for (const pattern of commitmentPatterns) {
    const match = normalizedText.match(pattern);
    const action = match?.groups?.action?.trim();
    if (!action) {
      continue;
    }

    const lowerAction = action.toLowerCase();
    if (weakActions.some((item) => lowerAction === item || lowerAction.startsWith(`${item} `))) {
      continue;
    }

    const dueAt = chrono.parseDate(normalizedText, message.date, {
      forwardDate: true,
    });

    return {
      action: cleanupAction(action),
      rawAction: action,
      dueAt,
      confidence: dueAt ? 0.93 : 0.64,
      reason: dueAt ? "explicit commitment with time" : "explicit commitment missing time",
      needsClarification: !dueAt,
    };
  }

  return null;
}

function cleanupAction(action: string) {
  return action.replace(/\b(tonight|tomorrow|today|next week|this week)\b/gi, "").replace(/\s+/g, " ").trim();
}
