import { TokenManager, type ApiToken, type CreatedToken } from "@forgeron/ui";
import { useState } from "react";

const scopes = [
  { id: "invoices:read", group: "Invoices", label: "Read", description: "List and open invoices" },
  { id: "invoices:write", group: "Invoices", label: "Write", description: "Create and edit" },
  { id: "people:read", group: "People", label: "Read" },
  { id: "webhooks:manage", group: "Webhooks", label: "Manage" },
];

const first: ApiToken[] = [
  {
    id: "t1",
    name: "CI deploy",
    prefix: "fg_test_xxxx",
    scopes: ["invoices:read", "invoices:write", "people:read", "webhooks:manage"],
    createdAt: "2026-09-02",
    lastUsedAt: "2026-11-18",
    expiresAt: "2026-11-22",
  },
  {
    id: "t2",
    name: "Reporting",
    prefix: "fg_test_yyyy",
    scopes: ["invoices:read"],
    createdAt: "2026-10-12",
    lastUsedAt: null,
    expiresAt: null,
  },
];

export default function Default() {
  const [tokens, setTokens] = useState<ApiToken[]>(first);
  const [created, setCreated] = useState<CreatedToken | null>(null);
  return (
    <div style={{ width: "100%" }}>
      <TokenManager
        tokens={tokens}
        scopes={scopes}
        today="2026-11-19"
        created={created}
        onCreate={(input) => {
          // The secret below is a placeholder: a real app gets it from its server.
          setTokens([
            ...tokens,
            {
              id: `t${tokens.length + 1}`,
              name: input.name,
              scopes: input.scopes,
              createdAt: "2026-11-19",
              expiresAt: input.expiresAt,
              prefix: "fg_test_zzzz",
            },
          ]);
          setCreated({ name: input.name, secret: "fg_test_xxxxxxxx" });
        }}
        onCreatedClose={() => setCreated(null)}
        onRevoke={(id) => setTokens(tokens.filter((t) => t.id !== id))}
      />
    </div>
  );
}
