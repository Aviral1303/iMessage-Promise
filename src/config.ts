import { z } from "zod";

const configSchema = z.object({
  keptOwnerChat: z.string().min(1, "KEPT_OWNER_CHAT missing"),
  keptWatchChatIds: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  keptDbPath: z.string().default("data/kept.sqlite"),
  keptPollIntervalMs: z.coerce.number().default(2000),
  keptReminderLookaheadMinutes: z.coerce.number().default(15),
  keptReminderTickMs: z.coerce.number().default(30000),
  keptDebug: z
    .string()
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export type AppConfig = ReturnType<typeof loadConfig>;

export function loadConfig() {
  const parsed = configSchema.parse({
    keptOwnerChat: Bun.env.KEPT_OWNER_CHAT,
    keptWatchChatIds: Bun.env.KEPT_WATCH_CHAT_IDS,
    keptDbPath: Bun.env.KEPT_DB_PATH,
    keptPollIntervalMs: Bun.env.KEPT_POLL_INTERVAL_MS,
    keptReminderLookaheadMinutes: Bun.env.KEPT_REMINDER_LOOKAHEAD_MINUTES,
    keptReminderTickMs: Bun.env.KEPT_REMINDER_TICK_MS,
    keptDebug: Bun.env.KEPT_DEBUG,
  });

  return {
    ownerChat: parsed.keptOwnerChat,
    watchChatIds: parsed.keptWatchChatIds,
    dbPath: parsed.keptDbPath,
    pollIntervalMs: parsed.keptPollIntervalMs,
    reminderLookaheadMinutes: parsed.keptReminderLookaheadMinutes,
    reminderTickMs: parsed.keptReminderTickMs,
    debug: parsed.keptDebug,
  };
}
