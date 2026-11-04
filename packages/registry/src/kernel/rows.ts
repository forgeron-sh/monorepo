export type Row = Record<string, unknown>;

export const text = (value: unknown) =>
  value === null || value === undefined ? undefined : String(value);
export const json = (value: unknown) =>
  typeof value === "string" ? (JSON.parse(value) as unknown) : null;
