# Kept

Kept is an iMessage-native promise closer for macOS.

It watches the iMessage chats you explicitly opt into, catches promises you make like `I'll send that tonight`, stores them locally, reminds you before they slip, and helps you close the loop with a draft follow-up.

## One-line pitch

`Kept turns the promises you make in iMessage into reminders and ready-to-send follow-ups, so nothing you say "I'll do" dies in the scroll.`

## What this repo is

This repo is a **local-first Bun + TypeScript app** built on top of [`@photon-ai/imessage-kit`](https://github.com/photon-hq/imessage-kit). It runs on a Mac that already has access to your iMessage account.

This is not a hosted SaaS app and not a cloud bot.

## Platform

**Mac only.**

Kept depends on macOS iMessage access through `imessage-kit`, so it is meant to run on a MacBook or other macOS machine where Messages is available.

## Current status

This repo is a working MVP codebase.

What is implemented:

- watches opted-in 1:1 iMessage chats
- detects explicit first-person commitments such as:
  - `I'll send that tonight`
  - `I can review tomorrow`
  - `let me book that next week`
- stores promises in a local SQLite database
- sends reminders to a configured owner chat
- supports basic owner-chat commands for managing promises
- drafts a follow-up message and can send it back into the original chat

What is **not** claimed yet:

- production hardening
- hosted deployment
- broad natural-language understanding beyond the current rule-based MVP
- deep polish for every edge case in iMessage behavior

## Core flow

1. You send a message in a watched 1:1 iMessage chat.
2. Kept detects an explicit promise.
3. Kept stores:
   - who the promise was made to
   - what you said you would do
   - when it is due, if Kept can infer the time
4. Kept messages you in your owner chat.
5. Later, Kept reminds you before or around the due time.
6. You can mark it done, snooze it, or ask Kept to draft an update.

## How Kept works

Main pieces:

- `src/index.ts`: app entrypoint
- `src/imessage/`: iMessage SDK setup and sending
- `src/agent/extractor.ts`: promise detection logic
- `src/agent/router.ts`: main event router and owner-chat command handling
- `src/storage/`: SQLite schema and repository layer
- `src/jobs/reminder-scheduler.ts`: reminder loop
- `tests/`: command parsing and extraction tests

## Requirements

Before running Kept, you need:

- macOS
- Bun
- access to the Messages app on that Mac
- **Full Disk Access** for the terminal or editor you use to run Kept

## Installation

```bash
bun install
```

## Permissions

Kept reads local iMessage data through `imessage-kit`.

You must give **Full Disk Access** to the app that runs Kept, usually:

- Terminal
- iTerm
- Warp
- Cursor
- VS Code

On macOS:

1. Open `System Settings`
2. Go to `Privacy & Security`
3. Open `Full Disk Access`
4. Add the app you will use to run Kept
5. Restart that app after granting permission

If you skip this step, Kept will not be able to read the Messages database.

## Environment setup

Copy the example env file:

```bash
cp .env.example .env
```

Current environment variables:

### `KEPT_OWNER_CHAT`

The chat where Kept talks to **you**.

This is your control thread for reminders and commands.

Example:

```bash
KEPT_OWNER_CHAT=iMessage;+1234567890
```

### `KEPT_WATCH_CHAT_IDS`

Comma-separated list of chat IDs Kept should watch for promises.

Only these chats are monitored.

Example:

```bash
KEPT_WATCH_CHAT_IDS=iMessage;+1234567890,iMessage;+19876543210
```

### `KEPT_DB_PATH`

Path to the local SQLite file used by Kept.

Default:

```bash
KEPT_DB_PATH=data/kept.sqlite
```

### `KEPT_POLL_INTERVAL_MS`

How often Kept polls for new messages.

### `KEPT_REMINDER_LOOKAHEAD_MINUTES`

How far ahead Kept looks for due promises to remind you about.

### `KEPT_REMINDER_TICK_MS`

How often the reminder scheduler checks for due promises.

### `KEPT_DEBUG`

Turns on extra SDK debug logging.

## How to find chat IDs

Run:

```bash
bun run chats
```

This prints recent chats as JSON with fields such as:

- `chatId`
- `displayName`
- `isGroup`
- `unreadCount`

Use the `chatId` values from that output in your `.env`.

## Running the app

Start Kept:

```bash
bun run start
```

For development mode:

```bash
bun run dev
```

## Available scripts

From `package.json`:

- `bun run start` — start Kept
- `bun run dev` — run with watch mode
- `bun run chats` — list recent chats and chat IDs
- `bun run test` — run unit tests
- `bun run check` — run TypeScript type checking

## Owner chat commands

These commands are sent in the `KEPT_OWNER_CHAT` thread.

### `show open promises`

Lists active promises Kept is tracking.

### `help`

Shows command usage.

### `why abc123`

Explains why Kept created a promise by quoting the source message.

### `ignore abc123`

Dismisses a tracked promise.

### `done abc123`

Marks a promise as done.

### `snooze 2h abc123`

Moves the reminder to a later time.

You can use natural-looking values like:

- `snooze 2h abc123`
- `snooze tomorrow 9am abc123`

### `draft update abc123`

Creates a short update message for the original chat.

### `send it abc123`

Sends the drafted update into the original chat.

## What Kept detects today

Kept currently aims for a narrow, safer first slice:

- explicit first-person commitments
- mostly direct statements from **you**
- 1:1 chats only
- best results when the promise includes a time signal

Examples that should work well:

- `I'll send that tonight`
- `I can review this tomorrow morning`
- `let me book that next week`

Examples that are less reliable:

- vague intent like `maybe I'll look at it`
- subtle social implications
- promises embedded in long complex messages
- group chat coordination

## Data and privacy

Kept is designed as a local-first app.

Current behavior:

- stores tracked promises in a local SQLite database
- uses the local Messages database through `imessage-kit`
- only watches chats you explicitly configure
- does not auto-send to other people unless you explicitly tell it to

## Architecture summary

High-level flow:

1. `src/imessage/sdk.ts` creates the iMessage SDK client
2. `src/index.ts` starts the watcher and reminder scheduler
3. `src/agent/router.ts` receives messages and routes them
4. `src/agent/extractor.ts` turns explicit commitments into structured promise candidates
5. `src/storage/promise-repo.ts` persists them
6. `src/jobs/reminder-scheduler.ts` triggers reminders
7. `src/commands/user-commands.ts` parses owner-chat commands

## Tests

Run tests:

```bash
bun run test
```

Run type-check:

```bash
bun run check
```

## Known limitations

- macOS only
- depends on local iMessage access
- no web UI
- no remote deployment target in this repo
- no automatic onboarding flow yet
- owner chat must be configured manually
- extraction logic is intentionally simple and conservative
- currently focused on direct-message promise tracking, not full relationship memory

## Troubleshooting

### Kept cannot read messages

Most likely cause: missing Full Disk Access.

Fix:

- grant Full Disk Access to the app running Kept
- restart that app
- run Kept again

### `bun run chats` returns nothing useful

Possible causes:

- wrong permissions
- no recent iMessage chats on that Mac
- Messages not properly available on the machine

### Kept starts but tracks nothing

Check:

- `KEPT_WATCH_CHAT_IDS` is set correctly
- the chat is a 1:1 chat
- the message contains a clear explicit promise

### Reminders never arrive

Check:

- `KEPT_OWNER_CHAT` is correct
- the promise included a detectable time
- the reminder scheduler is running

## Suggested demo

If someone wants to try the repo, this is the easiest path:

1. Set `KEPT_OWNER_CHAT`
2. Add one direct-message chat to `KEPT_WATCH_CHAT_IDS`
3. Start Kept with `bun run start`
4. In the watched chat, send:

```text
I'll send that tonight
```

5. Watch Kept message the owner chat
6. Use:

```text
show open promises
draft update <id>
send it <id>
```

## Why Photon

Kept uses `@photon-ai/imessage-kit` as the iMessage transport layer:

- watching messages
- listing chats
- sending messages

This repo uses Photon at the transport level, not as a hosted multi-platform deployment system.

## Repo goal

This repo is meant to be easy to understand, easy to run on a Mac, and honest about what is implemented today.
