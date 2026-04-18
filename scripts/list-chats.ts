import { IMessageSDK } from "@photon-ai/imessage-kit";

const sdk = new IMessageSDK();

try {
  const chats = await sdk.listChats({ limit: 50, sortBy: "recent" });
  for (const chat of chats) {
    console.log(
      JSON.stringify({
        chatId: chat.chatId,
        displayName: chat.displayName,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
      }),
    );
  }
} finally {
  await sdk.close();
}
