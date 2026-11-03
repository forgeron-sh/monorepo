# @forgeron/ui

The React components of the design system, and its tokens (generated from `assets/design-system/tokens.json`).

## Components

`Badge`, `EnvTag`, `Button`, `Label`, `Logo`, plus the view building blocks:

| Component  | Role                                                                             |
| ---------- | -------------------------------------------------------------------------------- |
| `Page`     | View layout: title, description, actions, content                                |
| `Table`    | Typed columns and rows, optional clickable (keyboard-focusable) rows, empty text |
| `Board`    | Columns of cards; layout only, moving cards is up to the caller                  |
| `Stat`     | One figure with label and hint                                                   |
| `BarChart` | Horizontal bars; each bar carries its label and value as text                    |
| `Select`   | Native `<select>` with sharp corners, options array and optional placeholder     |

Import `@forgeron/ui/styles.css` once. Components are stateless and render on the client (server rendering is out of scope).

## Notes

Does not import the SDK (rule `ui-does-not-import-sdk`). `react` is a peer dependency. Brand: `docs/design-system.md`.
