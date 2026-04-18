import type { IMessageSDK } from "@photon-ai/imessage-kit";

export class ChatDirectory {
  private readonly names = new Map<string, string | null>();

  async warm(sdk: IMessageSDK) {
    const chats = await sdk.listChats({ limit: 250, sortBy: "recent" });
    for (const chat of chats) {
      this.names.set(chat.chatId, chat.displayName);
    }
  }

  getName(chatId: string) {
    return this.names.get(chatId) ?? null;
  }
}
