import { z } from "zod";

/**
 * The body of every refusal of the platform API: `{ error, message? }`, as the hand-written handlers
 * answer today. `error` is a code (`UNAUTHENTICATED`, `FORBIDDEN`, `INVALID`, `NOT_FOUND`…).
 */
export const ErrorSchema = z.strictObject({
  error: z.string(),
  message: z.string().optional(),
});
export type ErrorBody = z.infer<typeof ErrorSchema>;
