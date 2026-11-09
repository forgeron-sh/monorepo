# Adding the Odoo gateway to Claude

For a person who wants to use the `odoo-gateway` tool from Claude. It states what the platform does today; where a step depends on Claude's own screens, it says so instead of naming a menu.

## What you need

- The address of your workspace, `https://<workspace>.<domain>` (for example the one your administrator gave you).
- The tool must be deployed to **production** in that workspace and you must hold a role that may call it (`reader` or `support`, see the template's README). Ask your administrator if the tool is not listed in the console.
- Your own Odoo login (your email) and your own Odoo API key. The key is created in your Odoo profile; Odoo decides what it lets you see.

## 1. The address to give Claude

The tool's MCP address is:

```text
https://<workspace>.<domain>/t/odoo/mcp
```

`odoo` is the tool's name in the workspace; a preview is reached with `/t/odoo@<branch>/mcp` instead (D-080). In Claude, add a **remote MCP server** (a custom connector) with this address. The names of Claude's menus change between versions and are not repeated here: use the place where Claude asks for a remote MCP server by URL.

## 2. Sign in

Claude opens a page of your workspace the first time it connects (`/auth/login`). Sign in with your company account, or with the code sent to your email if your workspace uses email sign-in. The page asks you to authorise the connection for the tool `odoo` only: the token it gives Claude is valid for that tool and no other (D-015).

## 3. Give your Odoo key once

The first time you ask for something (for example "my open tickets"), the tool answers that it needs your Odoo login and API key. Over MCP, Claude shows you a link; in a terminal, the answer carries it. The link opens `https://<workspace>.<domain>/t/odoo/secrets`, a page of the gateway:

1. Type your Odoo login and your Odoo API key in the two fields. The key is a password field.
2. Submit. The page confirms that the values are saved.
3. Ask Claude again.

The values are stored sealed at the gateway, for you and for this tool only. They are never shown again (the page says "set"), never given to another person, to the administrator or to the tool's code in the console, and a value is never typed in the conversation with Claude. The link is the same in preview and production: your secrets belong to the tool, not to an environment (FOR-174).

To change the key, open the same page and type the new one.

## 4. Use it

Ask in plain words: "my open tickets", "show ticket 12345", "reply to ticket 12345 that the part ships Monday". A reply is sent only after you confirm it. From a terminal, run `forgeron login` once, then `forgeron odoo tickets list`.

## If something fails

| You see                            | Likely cause                                                          | What to do                                                |
| ---------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| A request for a link or your key   | Your Odoo login and key are not stored yet                            | Follow step 3                                             |
| `401` or a sign-in page again      | Your session or token expired                                         | Sign in again from Claude                                 |
| `403`                              | Your role does not allow the action, or the token is for another tool | Ask your administrator for the role `reader` or `support` |
| Odoo says you may not see a ticket | Your Odoo key is limited by Odoo's own rules                          | That is Odoo's rule: ask your Odoo administrator          |
| The tool is not found              | Not deployed to production, or a wrong workspace address              | Ask your administrator                                    |

Not verified: this guide was written from the platform's code, its decisions and its tests (D-015, D-036, D-079, D-080). It was not followed on a real workspace with a real Odoo, and the exact steps in Claude's own interface are not described.
