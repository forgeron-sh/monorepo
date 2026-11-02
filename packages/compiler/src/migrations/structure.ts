import type { DatabaseSync } from "node:sqlite";

// What a SQLite database is made of, for comparing two of them: tables with their columns, indexes,
// foreign keys and triggers. The order of columns does not matter (an ALTER adds at the end).

export type Structure = Record<
  string,
  { columns: string[]; indexes: string[]; foreignKeys: string[]; triggers: string[] }
>;

export function structure(db: DatabaseSync): Structure {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all() as Array<{ name: string }>;
  const out: Structure = {};
  for (const { name } of tables) {
    const q = JSON.stringify(name);
    const columns = (db.prepare(`PRAGMA table_info(${q})`).all() as Array<Record<string, unknown>>)
      .map((c) => `${c.name}:${c.type}:${c.notnull}:${c.dflt_value}:${c.pk}`)
      .sort();
    const indexes = (db.prepare(`PRAGMA index_list(${q})`).all() as Array<Record<string, unknown>>)
      .filter((i) => i.origin === "c" || i.origin === "u")
      .map((i) => `${i.name}:${i.unique}`)
      .sort();
    const foreignKeys = (
      db.prepare(`PRAGMA foreign_key_list(${q})`).all() as Array<Record<string, unknown>>
    )
      .map((f) => `${f.from}->${f.table}.${f.to}:${f.on_delete}`)
      .sort();
    const triggers = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ?")
        .all(name) as Array<{ name: string }>
    )
      .map((r) => r.name)
      .sort();
    out[name] = { columns, indexes, foreignKeys, triggers };
  }
  return out;
}
