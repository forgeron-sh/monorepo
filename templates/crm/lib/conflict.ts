import { ToolError } from "@forgeron/sdk";

/** Runs a write; a UNIQUE constraint that refuses it becomes a `CONFLICT` the caller can read. */
export async function orConflict<T>(write: Promise<T>, message: string): Promise<T> {
  try {
    return await write;
  } catch (error) {
    if (error instanceof Error && /UNIQUE/i.test(error.message))
      throw new ToolError("CONFLICT", message);
    throw error;
  }
}
