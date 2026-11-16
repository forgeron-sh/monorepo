# Forgeron — design system

Forgeron is the platform where companies forge, version and host their internal tools. A tool is written once with the SDK (actions, permissions, data) and exposed through four interfaces: MCP for Claude, API, Web and CLI (every action becomes a command, e.g. `forgeron odoo tickets list`). The identity lives in a black-and-white anvil struck with one ember accent: the system is near-black and white, ember marks what matters, and the state colors are reserved for states.

## Principles

The design language is the one of the `forgeron.sh` landing (the "lab" language, adopted as the source of truth in November 2026): near-black, a film grain, pixel type, technical drawings, one ember accent.

1. **Black first, one accent.** Near-black `bg`, `ink` text, and a single brand accent, ember (`accent`), used once or twice per screen: the primary button, section indices, the `$` prompt, what is active. No second hue, no gradient behind text.
2. **Color is information.** `success`, `warning` and `danger` appear only for a state and always with a word. `danger` is kept pink-red so it never reads as the ember accent.
3. **Lines, not shadows.** We separate with `line`; framed blocks use `line-strong`. `shadow-pop` is reserved for what floats (menus, command palette).
4. **Zero rounding.** Like the anvil: every corner is sharp (`radius-none`), status LEDs included: they are 6px squares.
5. **Pixels are whole.** The pixel face steps by 10px (one pixel is 0.1em), pixel icons by 12px, canvases are drawn with `image-rendering: pixelated`.
6. **Made for developers.** Code, identifiers and versions are first-class citizens, in mono; labels and navigation are mono capitals.

## Tone and content

- The interface is in English. Plain, direct tone. Short sentences, in the second person ("you").
- Terms developers use stay as they are: commit, branch, preview, build, MCP, API, SSO, SDK. We write "tool" or "internal tool" for the object.
- Fixed vocabulary: **workspace** (the company), **tool**, **action** (what the SDK defines, e.g. `crm.contacts.update`), **interface** (MCP, API, Web, CLI), **version**, **environment** (Production, Preview), **access**, **team**.
- The forge register is used sparingly: the verb "forge" appears only in marketing headlines ("Forge your tools."), never in action labels. A button says "Deploy", not "Forge".
- Buttons: an imperative verb, no period. Error messages: what happened, then what to do ("The build failed at the test step. Open the logs.").
- No emoji in the interface or in the documentation.
- Real examples rather than lorem ipsum: a CRM, a contact record, an Odoo gateway.

## Color

Tokens in `assets/design-system/tokens.json`, generated into `packages/ui/tokens/tokens.css` (`bun run tokens` in `packages/ui`, checked by `tokens:check`).

- Page background `bg`; raised or hovered areas `bg-raised` (hovered rows and cards, the highlighted layer of a legend, the app's sidebar); code, terminals and commands `bg-sunk`.
- Text `ink`; secondary text and leads `ink-muted` (at least 4.5:1); `ink-dim` for figure labels (FIG.01), tag brackets, disabled states and field outlines, never for running text.
- `accent` (ember), the one orange of the system: every ember fill, LED, chip and accent text uses this token, never a hex value. `accent-ink` (near-black) is the text on it; when a hover turns the fill to `ink`, the text turns to `bg`. `focus` is the ember ring. The light theme gives the token a deeper shade so ember text keeps 4.5:1.
- Strong elements that are not the primary action (selected item, Production, the ink button): `ink` fill, `bg` text.
- Rules `line`; outlines of buttons, chips, tags and framed cards `line-strong`.
- States: `success` / `success-subtle`, `warning` / `warning-subtle`, `danger` / `danger-subtle`, always with a word.
- The **Forge (dark)** theme is the default; **Atelier (light)** is its negative, for the console.

## Typography

- `pixel` (Forge Sans, the bitmap face shipped with the tokens; its family name is written once, `type.faces.pixel`, and read through `--font-pixel-face`): marketing titles, in capitals, medium weight, at 100, 60 and 30px (`Title`), stepping down by 10px on narrow screens. Pixel text drawn as SVG (`PixelText`, `PixelTitle`) for indices, figures and the wordmark.
- `sans` (Geist): the interface and running text: `title-1` to `title-3`, `lead`, `body`, `small`, `caption`.
- `mono` (Geist Mono): `code`, `code-inline`, and `eyebrow` (12px capitals): labels, navigation, metadata. Everything that gets copy-pasted is in mono.
- `bit` (Silkscreen): `bit`, tiny status words next to a LED.
- Geist, Geist Mono and Silkscreen come from Google Fonts on the site. The console's CSP allows no third-party style, so it falls back to the system stacks until the faces are self-hosted.
- Headings in sentence case in the app ("Deployed versions"); marketing titles are set in capitals by the pixel face.

## Spacing, radii, borders, motion

- 4px grid: `space-1` (4) to `space-24` (96). Card padding `space-6`, gap between fields `space-4`, between sections `space-8`.
- The site sits in a rail: `rail` (1280px) framed by two `line` borders, `gutter` (24px, 32px on the home page) inside.
- `radius-none` everywhere. `border-width` 1px for every rule; the focus ring is `focus-width` (2px) at `focus-offset` (2px).
- Developer-tool density in the app: 32px controls, 44px table rows, 14px text. The site's buttons are 40px (`lg`).
- Motion: `motion-fast` (150ms) for the color and border of controls, `motion-base` (200ms) for hovered rows and cards. Only color, background, border and small transforms move. Under `prefers-reduced-motion`, loops stop and canvases draw a single frame.

## States and interaction

- Hover: a button's outline turns `ink`; rows and cards take `bg-raised`; a text link turns ember.
- Keyboard focus: a solid 2px ember ring, offset by 2px, on every interactive element.
- Disabled: `ink-dim` text, `line` outline, no global opacity.

## Components

The atoms live in `@forgeron/ui` (React, rendered to static markup: they work in an Astro page without JavaScript and in the console). A page loads `@forgeron/ui/tokens.css` and `@forgeron/ui/atoms.css`; the console loads `@forgeron/ui/styles.css`, which adds the composite components (shell, tables, dialogs, menus). Sections, navigation, hero and footer are page composition, in the app that owns them.

| Atom                                                                            | Variants and props                                                                                                                   | Use                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `Button`                                                                        | `primary` (ember, one per view), `secondary` (outline), `ink`, `ghost`, `danger`; `sm` 30, `md` 32, `lg` 40; `marker`, `kbd`, `href` | Actions. Mono capitals. A link when given `href`.                            |
| `Link`                                                                          | `href`                                                                                                                               | A standalone text link: mono capitals, ember on hover ("Read the SDK →").    |
| `Tag`                                                                           | `strong`, children                                                                                                                   | `[ Strong rest ]`: section names, file metadata, versions.                   |
| `Label`                                                                         | children                                                                                                                             | Eyebrow above a block: mono capitals, `ink-muted`.                           |
| `Chip`                                                                          | `active`                                                                                                                             | One of a set of options (MCP, API, Web, CLI); not interactive.               |
| `Badge`                                                                         | tone `neutral`, `strong`, `success`, `warning`, `danger`; `dot` (a LED); `mono` keeps the case of an identifier                      | Short status or role.                                                        |
| `EnvTag`                                                                        | `production` (ink fill), `channel` (ink outline), `preview` (dashed)                                                                 | The channel of a version, told by shape.                                     |
| `Led`                                                                           | tone `neutral`, `success`, `warning`, `danger`, `accent`, `current` (the square marker); `label` when alone                          | A 6px square next to its word.                                               |
| `Command`                                                                       | `prompt` (`$`), `framed`                                                                                                             | A command to type; the prompt is ember and hidden from assistive technology. |
| `Icon`                                                                          | `icon` (from `@forgeron/icons`), `size` (multiple of 12), `variant` `duo` (secondary pixels in ember) or `mono`, `title`             | Pixel icons; a stub renders nothing.                                         |
| `Title`                                                                         | `size` `hero`, `h2`, `h3`; `as`                                                                                                      | Marketing headings in the pixel font.                                        |
| `PixelText`                                                                     | `text`, `label`, `bold`, `keepCase`                                                                                                  | Text drawn in the pixel face as SVG: indices, figures. Scales with its box.  |
| `PixelTitle`                                                                    | `text` (`\n` for a line), `size`, `as`                                                                                               | A heading drawn word by word in SVG, its text kept for assistive technology. |
| `Logo`                                                                          | `symbol`, `horizontal`; `size`                                                                                                       | The pixel anvil and wordmark.                                                |
| `Avatar`, `Stat`, `Skeleton`, `Spinner`, `Input`, `Checkbox`, `Select`, `Field` | as before                                                                                                                            | Restyled with the tokens: mono labels, ink-dim outlines, ember checks.       |

## Environments and versions

Every push to GitHub produces a version. Environments are told apart by **shape** (`EnvTag`), never by color:

- **Production**: solid `ink` fill, filled square.
- **Preview**: dashed outline, `ink-muted` text — branch build.

Build states (`Live`, `Building`, `Failed`) go through `Badge` with `success`, `warning`, `danger`.

## Logo

- The site and the console draw the **pixel logo** (`Logo`): the anvil sampled on a 12-pixel grid and the wordmark in the pixel face, in `currentColor`. The vector files of the **Logos** group (symbol, horizontal logo, wordmark, on-background versions) stay for avatars, favicons and app icons.
- On a dark `bg`: the light version; on a light background: the dark version. Never another color, never an outline, a gradient or a shadow.
- The logotype is written in lowercase: "forgeron". In running text, the name is written "Forgeron".
- Clear space and minimum size: to be defined.

## Iconography

- `@forgeron/icons`: pixel icons on a 12-pixel grid, monotone or duotone (secondary pixels in ember), at 12, 24 or 48px (drawing guide: [`icons.md`](icons.md)). Through the `Icon` atom.
- A status icon always comes with its label; no icon alone carries information.
- The anvil symbol is not an interface icon: it is used only for the brand.
