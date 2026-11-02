import type { Failure } from "./types";
import { HTTP_STATUS } from "./types";

export function errorResponse(error: Failure | { code: string; message: string }, status?: number) {
  const code = error.code as keyof typeof HTTP_STATUS;
  return Response.json({ error }, { status: status ?? HTTP_STATUS[code] ?? 500 });
}
