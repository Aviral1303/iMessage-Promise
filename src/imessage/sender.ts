import type { IMessageSDK } from "@photon-ai/imessage-kit";

export class IMessageSender {
  constructor(private readonly sdk: IMessageSDK) {}

  async send(chatId: string, text: string) {
    await this.sdk.send(chatId, text);
  }
}
