import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import { schema } from "./schema.ts";

export function createDb(dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath, { create: true });
  db.exec(schema);

  return db;
}

export type AppDb = ReturnType<typeof createDb>;
