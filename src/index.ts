import { loadConfig } from "./config.ts";
import { createDb } from "./storage/db.ts";
import { PromiseRepo } from "./storage/promise-repo.ts";
import { createIMessageSdk } from "./imessage/sdk.ts";
import { IMessageSender } from "./imessage/sender.ts";
import { ChatDirectory } from "./imessage/chat-directory.ts";
import { AgentRouter } from "./agent/router.ts";
import { ReminderScheduler } from "./jobs/reminder-scheduler.ts";

const config = loadConfig();
const db = createDb(config.dbPath);
const repo = new PromiseRepo(db);
const sdk = createIMessageSdk(config);
const sender = new IMessageSender(sdk);
const chatDirectory = new ChatDirectory();
await chatDirectory.warm(sdk);
const router = new AgentRouter(config, repo, sender, chatDirectory);
const scheduler = new ReminderScheduler(config, repo, sender);

await sdk.startWatching({
  onMessage: async (message) => {
    await router.handleMessage(message);
  },
  onError: (error) => {
    console.error("[Kept] watcher boom", error);
  },
});

scheduler.start();

console.log("[Kept] alive");
console.log(`[Kept] watching ${config.watchChatIds.length} chats`);

const shutdown = async () => {
  scheduler.stop();
  sdk.stopWatching();
  await sdk.close();
  db.close();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
