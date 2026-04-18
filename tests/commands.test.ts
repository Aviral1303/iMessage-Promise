import { describe, expect, test } from "bun:test";
import { parseUserCommand } from "../src/commands/user-commands.ts";

describe("parseUserCommand", () => {
  test("parses done", () => {
    expect(parseUserCommand("done abc123")).toEqual({
      kind: "done",
      promiseRef: "abc123",
    });
  });

  test("parses snooze", () => {
    expect(parseUserCommand("snooze 2h abc123")).toEqual({
      kind: "snooze",
      durationText: "2h",
      promiseRef: "abc123",
    });
  });

  test("parses show open", () => {
    expect(parseUserCommand("show open promises")).toEqual({
      kind: "show_open",
    });
  });
});
