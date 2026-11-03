import { z } from "@forgeron/sdk";

/** Free-form attributes: a few known keys, and whatever else the equipment type needs. */
export const attributes = z.looseObject({
  power_kw: z.number().optional(),
  refrigerant: z.string().optional(),
  serial: z.string().optional(),
});

export type Attributes = z.output<typeof attributes>;

/** Reads the JSON text of a row; an unreadable value is an empty set rather than a failed read. */
export function readAttributes(text: string): Attributes {
  try {
    const parsed = attributes.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/** Whether the text is a real calendar day, `YYYY-MM-DD`. */
export function isDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)
  );
}
