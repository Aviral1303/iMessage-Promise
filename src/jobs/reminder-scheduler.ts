import type { AppConfig } from "../config.ts";
import type { PromiseRepo } from "../storage/promise-repo.ts";
import type { IMessageSender } from "../imessage/sender.ts";
import { formatReminder } from "../renderers/messages.ts";

export class ReminderScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly repo: PromiseRepo,
    private readonly sender: IMessageSender,
  ) {}

  start() {
    this.timer = setInterval(() => {
      void this.tick();
    }, this.config.reminderTickMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    const before = new Date(
      Date.now() + this.config.reminderLookaheadMinutes * 60_000,
    ).toISOString();

    const dueIds = this.repo.getDuePromiseIds(before);
    for (const { id } of dueIds) {
      const record = this.repo.getPromiseById(id);
      if (!record) {
        continue;
      }

      await this.sender.send(this.config.ownerChat, formatReminder(record));
      this.repo.markReminderSent(record.id);
      this.repo.addEvent(record.id, "reminder_sent", { before });
    }
  }
}
