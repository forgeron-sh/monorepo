# @forgeron/ui

The React components of the design system, and its tokens (generated from `assets/design-system/tokens.json`).

## Components

`Badge`, `EnvTag`, `Button`, `Label`, `Logo`, plus the view building blocks:

| Component                                   | Role                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Page`                                      | View layout: title, description, actions, content                                                        |
| `Table`                                     | Typed columns and rows, optional clickable (keyboard-focusable) rows, empty text                         |
| `Board`                                     | Columns of cards; layout only, moving cards is up to the caller                                          |
| `Stat`                                      | One figure with label and hint                                                                           |
| `BarChart`                                  | Horizontal bars; each bar carries its label and value as text                                            |
| `Select`                                    | Native `<select>` with sharp corners, options array and optional placeholder                             |
| `AppShell`                                  | Sidebar, content, skip link; the sidebar collapses behind a menu button on a phone                       |
| `Sidebar`, `Nav`                            | The `surface` column (header, body, footer) and its list of links; `aria-current` marks the page         |
| `Dialog`                                    | Modal: focus goes in, Tab stays inside, Escape closes, focus returns                                     |
| `Field`, `Input`, `Textarea`, `Checkbox`    | A label, a control, a hint and an error tied together; 32px controls                                     |
| `Notice`, `EmptyState`, `Spinner`           | Messages (always with a word for the state), the empty list, the wait                                    |
| `Skeleton`, `SkeletonText`, `SkeletonGroup` | The shape of what is coming, in place of a spinner; the group announces the wait once, with a word       |
| `CopyBlock`                                 | The text to copy in mono, and a button that copies it                                                    |
| `Menu`                                      | A button that opens a menu of links, actions and choices; arrows, Home, End, Escape and click outside    |
| `Avatar`                                    | Initials in a sharp square, decorative                                                                   |
| `SettingsGroup`, `SettingsRow`              | A titled card of rows: label and description left, control right, a chevron on a link row; a danger tone |
| `Tabs`                                      | Tabs with a panel; arrow keys, Home and End move between them                                            |

Import `@forgeron/ui/styles.css` once. Components are stateless and render on the client (server rendering is out of scope).

## Notes

Does not import the SDK (rule `ui-does-not-import-sdk`). `react` is a peer dependency. Brand: `docs/design-system.md`.
