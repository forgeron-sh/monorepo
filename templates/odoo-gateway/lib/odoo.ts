import { ToolError, type Context } from "@forgeron/sdk";

// A minimal JSON-RPC client. Each call carries the person's own key, so Odoo enforces its own
// permissions: Claude only sees what the person would see.

function required(value: string | undefined, name: string, kind: string): string {
  if (!value) throw new ToolError("INVALID", `${name} is not set (${kind}).`);
  return value;
}

export function odoo(ctx: Context) {
  const url = required(ctx.secrets.ODOO_URL, "ODOO_URL", "tool secret");
  const db = required(ctx.secrets.ODOO_DB, "ODOO_DB", "tool secret");
  const login = required(ctx.userSecrets.ODOO_LOGIN, "ODOO_LOGIN", "per-person secret");
  const key = required(ctx.userSecrets.ODOO_API_KEY, "ODOO_API_KEY", "per-person secret");

  async function call<T>(model: string, method: string, args: unknown[], kwargs = {}): Promise<T> {
    const res = await ctx.fetch(`${url}/jsonrpc`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [db, login, key, model, method, args, kwargs],
        },
      }),
    });
    if (!res.ok) throw new ToolError("UPSTREAM", `Odoo answered HTTP ${res.status}.`);
    const body = await res.json();
    if (body.error) {
      const denied = /AccessDenied|AccessError/.test(body.error.data?.name ?? "");
      throw new ToolError(
        denied ? "FORBIDDEN" : "UPSTREAM",
        body.error.data?.message ?? "Odoo error",
      );
    }
    return body.result as T;
  }

  return { call };
}

export const TICKET_FIELDS = ["id", "name", "stage_id", "partner_id", "priority", "create_date"];
