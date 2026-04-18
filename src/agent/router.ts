import * as chrono from "chrono-node";
import type { Message } from "@photon-ai/imessage-kit";
import type { AppConfig } from "../config.ts";
import { extractCommitment } from "./extractor.ts";
import { PromiseRepo } from "../storage/promise-repo.ts";
import { IMessageSender } from "../imessage/sender.ts";
import { parseUserCommand } from "../commands/user-commands.ts";
import {
  formatCapture,
  formatDraft,
  formatPromiseLine,
  shortId,
} from "../renderers/messages.ts";
import type { PromiseRecord } from "../domain/promise.ts";

export class AgentRouter {
  constructor(
    private readonly config: AppConfig,
    private readonly repo: PromiseRepo,
    private readonly sender: IMessageSender,
  ) {}

  async handleMessage(message: Message) {
    if (message.isReaction || !message.text) {
      return;
    }

    if (message.chatId === this.config.ownerChat) {
      await this.handleOwnerChat(message);
      return;
    }

    if (!this.config.watchChatIds.includes(message.chatId)) {
      return;
    }

    if (message.isGroupChat || !message.isFromMe) {
      return;
    }

    if (this.repo.existsBySourceMessageGuid(message.guid)) {
      return;
    }

    const candidate = extractCommitment(message);
    if (!candidate) {
      return;
    }

    const now = new Date().toISOString();
    const record: PromiseRecord = {
      id: crypto.randomUUID(),
      sourceMessageGuid: message.guid,
      sourceChatId: message.chatId,
      sourceChatName: null,
      counterparty: message.senderName ?? message.sender,
      commitmentText: message.text,
      normalizedAction: candidate.action,
      dueAt: candidate.dueAt?.toISOString() ?? null,
      confidence: candidate.confidence,
      status: candidate.needsClarification ? "needs_clarification" : "open",
      needsClarification: candidate.needsClarification ? 1 : 0,
      reminderSentAt: null,
      draftedReply: null,
      createdAt: now,
      updatedAt: now,
    };

    this.repo.insert(record);
    this.repo.addEvent(record.id, "captured", {
      reason: candidate.reason,
      dueAt: record.dueAt,
    });

    await this.sender.send(this.config.ownerChat, formatCapture(record));

    if (candidate.needsClarification) {
      await this.sender.send(
        this.config.ownerChat,
        `[Kept] Need time for ${shortId(record.id)}. Reply: snooze tomorrow 9am ${shortId(record.id)}`,
      );
    }
  }

  private async handleOwnerChat(message: Message) {
    const text = message.text;
    if (!text) {
      return;
    }

    if (text.startsWith("[Kept]")) {
      return;
    }

    const command = parseUserCommand(text);
    switch (command.kind) {
      case "show_open": {
        const open = this.repo.getOpenPromises();
        const body =
          open.length === 0
            ? "[Kept] No open promises."
            : ["[Kept] Open promises:", ...open.map(formatPromiseLine)].join("\n");
        await this.sender.send(this.config.ownerChat, body);
        return;
      }

      case "help": {
        await this.sender.send(
          this.config.ownerChat,
          "[Kept] Try: show open promises | why abc123 | ignore abc123 | done abc123 | snooze 2h abc123 | draft update abc123 | send it abc123",
        );
        return;
      }

      case "why": {
        const record = await this.requirePromise(command.promiseRef);
        if (!record) return;
        await this.sender.send(
          this.config.ownerChat,
          `[Kept] ${shortId(record.id)} because you said: "${record.commitmentText}"`,
        );
        return;
      }

      case "ignore": {
        const record = await this.requirePromise(command.promiseRef);
        if (!record) return;
        this.repo.updateStatus(record.id, "dismissed");
        this.repo.addEvent(record.id, "dismissed");
        await this.sender.send(
          this.config.ownerChat,
          `[Kept] Ignored ${shortId(record.id)}.`,
        );
        return;
      }

      case "done": {
        const record = await this.requirePromise(command.promiseRef);
        if (!record) return;
        this.repo.updateStatus(record.id, "done");
        this.repo.addEvent(record.id, "done");
        await this.sender.send(
          this.config.ownerChat,
          `[Kept] Marked ${shortId(record.id)} done.`,
        );
        return;
      }

      case "draft_update": {
        const record = await this.requirePromise(command.promiseRef);
        if (!record) return;
        const draft = `Hey ${record.counterparty}, quick update: I am still on ${record.normalizedAction}. I will follow up soon.`;
        this.repo.saveDraft(record.id, draft);
        this.repo.addEvent(record.id, "drafted", { draft });
        await this.sender.send(this.config.ownerChat, formatDraft(record, draft));
        return;
      }

      case "send_it": {
        const record = await this.requirePromise(command.promiseRef);
        if (!record || !record.draftedReply) return;
        await this.sender.send(record.sourceChatId, record.draftedReply);
        this.repo.updateStatus(record.id, "closed_loop");
        this.repo.addEvent(record.id, "sent_to_source_chat");
        await this.sender.send(
          this.config.ownerChat,
          `[Kept] Sent update for ${shortId(record.id)}.`,
        );
        return;
      }

      case "snooze": {
        const record = await this.requirePromise(command.promiseRef);
        if (!record) return;
        const dueAt = chrono.parseDate(command.durationText, new Date(), {
          forwardDate: true,
        });

        if (!dueAt) {
          await this.sender.send(
            this.config.ownerChat,
            `[Kept] Bad snooze time. Try: snooze 2h ${shortId(record.id)}`,
          );
          return;
        }

        this.repo.updateStatus(record.id, "snoozed", dueAt.toISOString());
        this.repo.clearReminder(record.id);
        this.repo.addEvent(record.id, "snoozed", { dueAt: dueAt.toISOString() });
        await this.sender.send(
          this.config.ownerChat,
          `[Kept] Snoozed ${shortId(record.id)} until ${dueAt.toLocaleString()}.`,
        );
        return;
      }

      case "unknown": {
        if (/^(show|done|why|ignore|draft|send|snooze|help)/i.test(text)) {
          await this.sender.send(
            this.config.ownerChat,
            "[Kept] Bad command. Reply `help`.",
          );
        }
        return;
      }
    }
  }

  private resolvePromise(promiseRef?: string) {
    if (!promiseRef) {
      return this.repo.getLatestOpenPromise();
    }

    const exact = this.repo.getPromiseById(promiseRef);
    if (exact) {
      return exact;
    }

    const match = this.repo
      .getOpenPromises()
      .find((item) => item.id.startsWith(promiseRef));

    return match ?? null;
  }

  private async requirePromise(promiseRef?: string) {
    const record = this.resolvePromise(promiseRef);
    if (record) {
      return record;
    }

    await this.sender.send(
      this.config.ownerChat,
      "[Kept] No matching promise. Try `show open promises`.",
    );
    return null;
  }
}
