export type UserCommand =
  | { kind: "show_open" }
  | { kind: "help" }
  | { kind: "why"; promiseRef?: string }
  | { kind: "ignore"; promiseRef?: string }
  | { kind: "done"; promiseRef?: string }
  | { kind: "draft_update"; promiseRef?: string }
  | { kind: "send_it"; promiseRef?: string }
  | { kind: "snooze"; durationText: string; promiseRef?: string }
  | { kind: "unknown" };

export function parseUserCommand(text: string): UserCommand {
  const trimmed = text.trim().toLowerCase();

  if (trimmed === "show open promises" || trimmed === "show open") {
    return { kind: "show_open" };
  }

  if (trimmed === "help") {
    return { kind: "help" };
  }

  const why = trimmed.match(/^why(?:\s+([a-z0-9-]+))?$/i);
  if (why) {
    return { kind: "why", promiseRef: why[1] };
  }

  const ignore = trimmed.match(/^ignore(?:\s+([a-z0-9-]+))?$/i);
  if (ignore) {
    return { kind: "ignore", promiseRef: ignore[1] };
  }

  const done = trimmed.match(/^done(?:\s+([a-z0-9-]+))?$/i);
  if (done) {
    return { kind: "done", promiseRef: done[1] };
  }

  const draft = trimmed.match(/^draft update(?:\s+([a-z0-9-]+))?$/i);
  if (draft) {
    return { kind: "draft_update", promiseRef: draft[1] };
  }

  const sendIt = trimmed.match(/^send it(?:\s+([a-z0-9-]+))?$/i);
  if (sendIt) {
    return { kind: "send_it", promiseRef: sendIt[1] };
  }

  const snooze = trimmed.match(/^snooze\s+(.+?)(?:\s+([a-z0-9-]+))?$/i);
  if (snooze) {
    const durationText = (snooze[1] ?? "").trim();
    return {
      kind: "snooze",
      durationText,
      promiseRef: snooze[2],
    };
  }

  return { kind: "unknown" };
}
