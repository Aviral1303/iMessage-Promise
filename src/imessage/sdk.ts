import { IMessageSDK } from "@photon-ai/imessage-kit";
import type { AppConfig } from "../config.ts";

export function createIMessageSdk(config: AppConfig) {
  return new IMessageSDK({
    debug: config.debug,
    watcher: {
      pollInterval: config.pollIntervalMs,
      excludeOwnMessages: false,
      unreadOnly: false,
    },
  });
}
