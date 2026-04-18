# Kept

Kept is an iMessage-native promise closer.

It catches promises you make in iMessage, stores them, reminds you before they slip, and drafts a follow-up when you need help closing the loop.

## What works now

- Watches opted-in 1:1 iMessage chats
- Detects explicit commitments like `I'll send that tonight`
- Stores promise, due time, and counterparty in local SQLite
- Sends reminder DM to your owner chat
- Supports `show open promises`, `done`, `snooze`, `draft update`, and `send it`

## Setup

1. Install deps:

```bash
bun install
```

2. Give your terminal or Cursor **Full Disk Access** on macOS.

3. Copy env file:

```bash
cp .env.example .env
```

4. Discover chat IDs:

```bash
bun run chats
```

5. Set:
- `KEPT_OWNER_CHAT`: where Kept talks to you
- `KEPT_WATCH_CHAT_IDS`: comma-separated chats to watch for promises

## Run

```bash
bun run start
```

## Commands in owner chat

- `show open promises`
- `done abc123`
- `snooze 2h abc123`
- `draft update abc123`
- `send it abc123`

## Cave limits

- Local-first only
- Open-source `imessage-kit` on your Mac
- V1 trusts explicit promises more than vague intent
- No auto-send to other people without your command
