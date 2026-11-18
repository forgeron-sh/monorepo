# @forgeron/ui

The React components of the design system, and its tokens (generated from `assets/design-system/tokens.json`).

## Components

`Badge`, `EnvTag`, `Button`, `Label`, `Logo`, plus the view building blocks:

| Component                                      | Use                                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Page`                                         | View layout: title, description, actions, content                                                        |
| `Table`                                        | Typed columns and rows, optional clickable (keyboard-focusable) rows, empty text                         |
| `Board`                                        | Columns of cards; layout only, moving cards is up to the caller                                          |
| `Stat`                                         | One figure with label and hint                                                                           |
| `BarChart`                                     | Horizontal bars; each bar carries its label and value as text                                            |
| `Select`                                       | Native `<select>` with sharp corners, options array and optional placeholder                             |
| `AppShell`                                     | Sidebar, content, skip link; the sidebar collapses behind a menu button on a phone                       |
| `Sidebar`, `Nav`                               | The `surface` column (header, body, footer) and its list of links; `aria-current` marks the page         |
| `Dialog`                                       | Modal: focus goes in, Tab stays inside, Escape closes, focus returns                                     |
| `Field`, `Input`, `Textarea`, `Checkbox`       | A label, a control, a hint and an error tied together; 32px controls                                     |
| `Notice`, `EmptyState`, `Spinner`              | Messages (always with a word for the state), the empty list (plain, or in the hatched field), the wait   |
| `Skeleton`, `SkeletonText`, `SkeletonGroup`    | The shape of what is coming, in place of a spinner; the group announces the wait once, with a word       |
| `CopyBlock`                                    | The text to copy in mono, and a button that copies it                                                    |
| `Menu`                                         | A button that opens a menu of links, actions and choices; arrows, Home, End, Escape and click outside    |
| `Avatar`                                       | Initials in a sharp square, decorative                                                                   |
| `SettingsGroup`, `SettingsRow`                 | A titled card of rows: label and description left, control right, a chevron on a link row; a danger tone |
| `Tabs`                                         | Tabs with a panel; arrow keys, Home and End move between them                                            |
| `Switch`, `RadioGroup`, `Segmented`            | An on/off setting; one choice among a few (fieldset, square radios); a switch between views              |
| `Kbd`, `Progress`, `Separator`                 | Keyboard caps; a sharp progress track, in blocks or with no known end; a line, or the hatched band       |
| `IconButton`, `AppTile`, `Swatch`              | A square button with one pixel icon; the square mark of an app; a square of colour next to a name        |
| `AvatarGroup`, `SearchBox`, `Breadcrumb`       | Overlapping avatars and a `+n`; the magnifier, the query and its shortcut; the parents of the page       |
| `Calendar`                                     | A month, Monday first, driven from the keyboard; dates as `YYYY-MM-DD`                                   |
| `SelectMenu`, `DatePicker`                     | A choice in a popup list (icons, hints, typeahead); a date behind a chip, quick picks then the month     |
| `Tooltip`, `Toaster` + `useToast`              | A few words on hover or focus; confirmations at the bottom right, with an undo                           |
| `StatusPicker`, `PriorityPicker`, `SizePicker` | A record's state, priority and size, each with its pixel glyph (`StatusGlyph`…), after Tasks             |
| `QuarterPicker`, `PersonPicker`, `LabelPicker` | `2026-Q4`; an assignee or author, you first; several coloured labels at once                             |

Blocks, the composites of the apps (in `src/blocks/`, styles in `blocks.css`), after the Tasks prototype:

| Block                                            | Use                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `IssueList`, `IssueBoard`                        | Records in foldable groups or columns, one dense row or card each; arrows move, Enter opens        |
| `ProjectsTable`                                  | Projects with health, lead, target and a progress in blocks; sortable headers                      |
| `FilterBar`, `FilterMenu`, `matchesFilters`      | Filters as chips on a hatched band (is / is not, several values); the field then value picker      |
| `DisplayMenu`, `ViewHeader`                      | Layout, grouping, ordering and shown properties; the bar above a list: title, tabs, filter, action |
| `PropertyPanel`, `PropertyText`, `PropertyChips` | A record's properties as a labelled column of pickers, or a row of chips                           |
| `Activity`, `CommentComposer`                    | The timeline of a record (changes and comments) and the box to write one                           |
| `CreateDialog`, `Modal`                          | A new record from anywhere: title, description, property chips, ⌘↵                                 |
| `AppSidebar`, `InboxList`                        | The left column of an app: switcher, links, folding sections; notifications with unread marks      |
| `CommandPalette`, `ActionMenu`, `ContextMenu`    | ⌘K search over pages, records and actions; the actions of a record behind ⋯ or a right click       |

## Hooks

The state the components share, for your screens and your own components (`src/hooks/`):

| Hook                   | Use                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `useControllableState` | `value` / `defaultValue` / `onChange`: the pattern of every component, for your own                     |
| `useDisclosure`        | Open or closed, from a button or a key: `{ open, onOpen, onClose, toggle, props }`                      |
| `useShortcuts`         | Keys bound while shown (`f`, `shift+b`, `mod+k`), silent while typing; `formatShortcut` for `Kbd`       |
| `useActions`           | A screen's actions declared once: `menu` for ActionMenu / ContextMenu, `commands` for the palette, keys |
| `useListView`          | Filters and display options of a view, and the records they give, filtered, ordered and grouped         |

`DisplayMenu` takes its props for the usual menu, or children to compose any menu from its parts (`DisplayLayouts`, `DisplaySelect`, `DisplayToggle`, `DisplayProperties`, `DisplaySection`, `DisplayWhen`, `DisplayReset`): a layout is added with one entry (`MORE_LAYOUTS.timeline`, `.calendar` or your own) and its own options behind `DisplayWhen`. The reference screen that puts it all together is the gallery's `list-view` block.

## Shaders

The pixel effects of the Forgeron sites, in `src/shaders/`: the dither field (canvas), the WebGL field modes (ember, field, globe, dissolve), the dithered image, the hearth, the pixel reveal. Each one is a framework-free `mount…` function and a React component (`DitherField`, `FieldShader`, `DitheredImage`, `Hearth`, `PixelReveal`) that draws a still frame under reduced motion. They take the shader source and the Bayer matrix from `@forgeron/blueprint`'s core.

Every atom and block, with live examples, its code and its props: `apps/ui-gallery` (`ui.forgeron.sh`, `bun run --cwd apps/ui-gallery dev`, port 5181).

Import `@forgeron/ui/styles.css` once. Components are stateless and render on the client (server rendering is out of scope).

## Notes

Does not import the SDK (rule `ui-does-not-import-sdk`). The parts that open over the page use Base UI for their behaviour (D-147); their look is ours. `react` is a peer dependency. Brand: `docs/design-system.md`.
