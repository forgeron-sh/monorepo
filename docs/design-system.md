# Forgeron — design system

Forgeron is the platform where companies forge, version and host their internal tools. A tool is written once with the SDK (actions, permissions, data) and exposed through four interfaces: MCP for Claude, API, Web and CLI (every action becomes a command, e.g. `forgeron odoo tickets list`). The identity lives in a black-and-white anvil: the system is **monochrome**, and color is reserved for states.

## Principles

1. **Black and white first.** The brand accent is `ink` itself: white on a black `bg` in the dark theme, black on white in the light theme. No brand hue: no blue, no ember orange, no gradient.
2. **Color is information.** `success`, `warning` and `danger` appear only for a state (build, deployment, error) and always with a word or an icon.
3. **Lines, not shadows.** We separate with `line`. `shadow-pop` is reserved for what floats (menus, command palette).
4. **Zero rounding.** Like the anvil: everything has sharp corners (`radius-none`), cards, buttons and fields included. Round shapes exist only as cutouts (the anvil motif) or status dots (`radius-full`).
5. **Made for developers.** Code, identifiers and versions are first-class citizens, set in `code` / `code-inline`.

## Tone and content

- The interface is in English. Plain, direct tone. Short sentences, in the second person ("you").
- Terms developers use stay as they are: commit, branch, preview, build, MCP, API, SSO, SDK. We write "tool" or "internal tool" for the object.
- Fixed vocabulary: **workspace** (the company), **tool**, **action** (what the SDK defines, e.g. `crm.contacts.update`), **interface** (MCP, API, Web, CLI), **version**, **environment** (Production, Preview), **access**, **team**.
- The forge register is used sparingly: the verb "forge" appears only in marketing headlines ("Forge your tools."), never in action labels. A button says "Deploy", not "Forge".
- Buttons: an imperative verb, no period. Error messages: what happened, then what to do ("The build failed at the test step. Open the logs.").
- No emoji in the interface or in the documentation.
- Real examples rather than lorem ipsum: a CRM, a contact record, an Odoo gateway.

## Color

- Page background `bg`; secondary areas `surface`; cards and menus `surface-raised` with a `line` border; code and terminal `surface-sunken`.
- Text `ink`; secondary text and placeholders `ink-muted`; `ink-faint` only for disabled states and line numbers.
- Strong elements (primary button, checked box, Production environment, selection): `inverse` background, `on-inverse` text.
- Outlines of fields and secondary buttons: `line-strong` (≥ 3:1 in both themes).
- States: `success` / `success-subtle`, `warning` / `warning-subtle`, `danger` / `danger-subtle`, always with a label. These colors are never used to decorate.
- The **Forge (dark)** theme is the default theme, the logo's. The **Atelier (light)** theme is its exact negative.

## Typography

- `display` (Inter Display SemiBold, tight letter-spacing) for screen titles and marketing: `display-xl`, `display-l`, `title-1`. It is the logotype's typeface.
- `sans` (Inter) for the interface: `title-2`, `title-3`, `body` (14/22, the default size), `body-strong`, `small`, `caption`.
- `mono` (JetBrains Mono, loaded from Google Fonts) for `code`, `code-inline` and `eyebrow`. Everything that gets copy-pasted (CLI command, action name, version, hash, MCP URL) is in mono.
- Headings in sentence case ("Deployed versions"), never all caps except `eyebrow`.

## Spacing, radii, layout

- 4px grid: `space-1` (4) to `space-16` (64). Card padding `space-6`, gap between fields `space-4`, between sections `space-8`.
- `radius-none` (0) everywhere: cards, menus, code blocks, dialogs, buttons, fields, badges, checkboxes. Never a slight 4 or 6px rounding. `radius-full` only for status dots.
- Developer-tool density: 32px controls, 44px table rows, 14px text.
- App: `surface` sidebar on the left (workspace, tools, settings), content on `bg`, max reading width 1200px.

## States and interaction

- Hover: `surface-hover`. Active selection: `inverse`.
- Keyboard focus: a solid 2px `focus` ring, offset by 2px, on all interactive elements (≥ 14:1 on all surfaces).
- Disabled: `ink-faint` text, `line` outline, no global opacity.
- Motion: 120 ms transitions on background and border color only. Nothing bounces.

## Environments and versions

Every push to GitHub produces a version. Environments are told apart by **shape** (`EnvTag`), never by color:

- **Production**: solid `inverse` fill, filled dot.
- **Preview**: dashed outline, `ink-muted` text — branch build.

Build states (`Live`, `Building`, `Failed`) go through `Badge` with `success`, `warning`, `danger`.

## Logo

- Files in the **Logos** group: symbol (the anvil), horizontal logo (symbol + "forgeron"), wordmark alone, in white or black with no background, and on-background versions for avatars and app icons.
- On a dark `bg`: the **white** version; on a light background: the **black** version. Never any other color, never an outline, never a gradient or a shadow.
- The logotype is written in lowercase: "forgeron". In running text, the name is written "Forgeron".
- Avatar, favicon, app icon: `forgeron-symbol-full-bleed-*` (edge-to-edge symbol) or `forgeron-symbol-standard-*` (symbol with margin).
- Clear space and minimum size: to be defined.

## Iconography

- No dedicated icon set yet. In the meantime: Lucide, 1.5px stroke, 16px in the interface, in `ink` or `ink-muted`, never colored except for a state.
- A status icon always comes with its label; no icon alone carries information.
- The anvil symbol is not an interface icon: it is used only for the brand.
