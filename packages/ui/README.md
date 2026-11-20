# @forgeron/ui

The React components of the design system, and its tokens (generated from `assets/design-system/tokens.json`).

## Components

`Badge`, `EnvTag`, `Button`, `Eyebrow`, `CommandLine`, `Logo`, plus the view building blocks (`Label` is the form label and `Command` the ⌘K palette, as in shadcn: D-156):

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

The field primitives (typed, chosen, dragged, folded), each with `value` / `defaultValue` / `onChange` through `useControllableState`:

| Component                      | Use                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `Combobox`                     | Typeahead, one or several (chips); options from a server (`onInputChange`, `loading`), creatable (`onCreate`) |
| `TagInput`                     | Tags typed in: separator or Enter ends one, a paste is split, Backspace removes the last; `validate`          |
| `Slider`                       | One value or a range, step, marks, a written value; arrows, Page keys, Home and End                           |
| `Rating`, `Scale`, `Star`      | Pixel stars (halves, read-only); a row of numbers, with NPS colouring                                         |
| `TimePicker`                   | `HH:mm` in 24 hours (12 with `hour12`): spinbuttons and a list every `step` minutes                           |
| `DateRangePicker`              | A period on the Calendar: quick picks, first click starts, second ends; `{ from, to }`                        |
| `NumberInput`                  | Stepper buttons, min / max / step, read and written in the locale (`parseNumber`)                             |
| `MoneyInput`, `CurrencyPicker` | An amount in minor units (1250 is 12.50), the symbol on the locale's side; a currency in a short list         |
| `ColorPicker`                  | Swatches from the tokens (`COLOR_PALETTE`) and a hex field, in a popup or `inline`; no gradients              |
| `OtpInput`                     | One-time code in cells: auto-advance, paste fills all, `onComplete`                                           |
| `FileInput`                    | Button and drop target, list of files with remove, `accept` / `maxSize` / `maxFiles`, `onReject`              |
| `Popover`                      | Any content behind a button, on Base UI: title, description, close button                                     |
| `Collapsible`, `Accordion`     | A section that folds; a stack of them, one or several open                                                    |
| `SplitPane`                    | Two panes and a divider to drag or move with the arrows; size controlled or not                               |
| `Toolbar` (+ `ToolbarButton`…) | A row of tools as one tab stop (roving), toggles with `pressed`                                               |
| `Banner`                       | A page-level notice with an action, dismissible; the state always in a word                                   |

Shared mechanics taken out of the blocks (D-160), each in parts with a props-driven form:

| Component                                                 | Use                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `defineStatuses`, `Status` (+ `StatusIndicator`…)         | One set of states (label, tone, glyph, order) for pickers, badges and marks; a state always in a word   |
| `Tree` (+ `TreeItem`, `TreeItemContent`…)                 | APG tree: arrows, typeahead, selection; with `items`, the ready tree with rename, context menu and drag |
| `Feed` (+ `FeedItem`, `FeedIndicator`, `FeedTime`…)       | A log of events, grouped by day if wanted                                                               |
| `useSortable`, `Sortable` (+ `SortableItem`…)             | Reorder by drag and Alt + arrows, focus follows, each move announced                                    |
| `useCollection`, `SelectionBar` (+ parts)                 | Roving focus, single, multiple and range selection, typeahead, grids; the bar of actions on a selection |
| `AccessList` (+ parts), `PeopleCombobox`                  | People with a role each, remove, and the box to add them                                                |
| `Combobox` parts, `statusOptions`, `personOptions`…       | shadcn's combobox parts; the option lists of the record pickers, to compose with `Select` or `Combobox` |
| `DiffView`, `IconPicker`, `formatBytes`, `formatDuration` | Text and field diffs; the icon picker; one implementation of each formatter                             |

Records (`src/blocks/records-*`): `defineFields` describes a record's fields once, and `RecordList`, `RecordBoard`, `useRecordView`, the filters, display menu and property editors read it. `IssueList` and `IssueBoard` are presets over `issueFields`; `projectFields` is a second one.

Blocks, the composites of the apps (in `src/blocks/`, styles in `blocks.css`), after the Tasks prototype:

| Block                                                              | Use                                                                                                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `IssueList`, `IssueBoard`                                          | Records in foldable groups or columns, one dense row or card each; arrows move, Enter opens                                             |
| `ProjectsTable`                                                    | Projects with health, lead, target and a progress in blocks; sortable headers                                                           |
| `FilterBar`, `FilterMenu`, `matchesFilters`                        | Filters as chips on a hatched band (is / is not, several values); the field then value picker                                           |
| `DisplayMenu`, `ViewHeader`                                        | Layout, grouping, ordering and shown properties; the bar above a list: title, tabs, filter, action                                      |
| `PropertyPanel`, `PropertyText`, `PropertyChips`                   | A record's properties as a labelled column of pickers, or a row of chips                                                                |
| `Activity`, `CommentComposer`                                      | The timeline of a record (changes and comments) and the box to write one                                                                |
| `CreateDialog`, `Modal`                                            | A new record from anywhere: title, description, property chips, ⌘↵                                                                      |
| `AppSidebar`, `InboxList`                                          | The left column of an app: switcher, links, folding sections; notifications with unread marks                                           |
| `CommandPalette`, `ActionMenu`, `ContextMenu`                      | ⌘K search over pages, records and actions; the actions of a record behind ⋯ or a right click                                            |
| `LineItemsEditor`, `ProductPicker`                                 | Finance: the lines of any money document as a sheet (keys of a spreadsheet, sections, product search), totals worked out in minor units |
| `TotalsSummary`, `computeTotals`                                   | Finance: subtotal, discounts, tax by rate, total, paid, balance due; integer arithmetic, no float drift                                 |
| `ReceiptViewer`                                                    | Finance: a scanned page with recognised fields as boxes linked to an editable list with confidence                                      |
| `PaymentForm`, `luhnValid`, `ibanValid`                            | Finance: card and bank (SEPA) details, formatted and checked, test mode announced; stores and logs nothing                              |
| `StatementTable`, `buildStatement`, `AmountBadge`                  | Finance: a ledger with running balance, sections, subtotals, signed amounts, CSV export                                                 |
| `Paper`, `DocumentHeader`, `PartyBlock`, `MetaTable`, `printPaper` | Finance: a printable A4 or Letter sheet (repeated header and footer, page breaks) and the parts of a document                           |
| `ApprovalChain`, `ApprovalAudit`                                   | An approval as steps, people one by one or all at once, status, due date, reminder, comments; editable; audit                           |
| `ParticipantList`                                                  | People with role, status and order, reordered by drag or Alt + arrows                                                                   |
| `SignaturePad`                                                     | Draw (smoothed, undo), type (fonts) or upload a signature; PNG data URL; a keyboard pen                                                 |
| `DocumentViewer`, `FieldPlacer`                                    | Pages with thumbnails, zoom, search and an overlay; typed boxes placed on them for each participant                                     |
| `SealBadge`                                                        | Proof of a signature or approval: who, when with its zone, method, hash prefix                                                          |

Editor chrome and guidance blocks, for any canvas-like or document editor (`src/blocks/editor-*`). They import no editor (`ui-does-not-import-editors`): everything is props and callbacks, so `@forgeron/canvas` can adopt them. World positions and views are plain `{ x, y, w, h }` and `{ x, y, zoom }`; the pure helpers (`editorStepZoom`, `editorFitZoom`, `editorMinimapFit`, `editorPanViewport`, `editorReorderLayer`, `editorMoveLayer`, `editorGroupShortcuts`, `editorTourPlacement`, `editorProject`…) are exported too, all prefixed `editor`:

| Block                                         | Use                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `CanvasToolbar`                               | The tool dock: grouped tools, one active, variants in a menu, undo and redo; horizontal or vertical; keys bound for you    |
| `ZoomControls`                                | Zoom out and in, the percent with a menu (presets, fit, fill, 100%), shortcut hints                                        |
| `Minimap`                                     | The world as rectangles and the viewport as a frame: drag, click to jump, corner to zoom, arrows and + / − by key          |
| `LayersPanel`                                 | A tree of layers: groups, visibility, lock, rename (F2), multi-select, reorder by drag or Alt + arrows, indent and outdent |
| `CommentPin`, `PinLayer`                      | Numbered markers, open or resolved (a tick, never colour alone), placed from a view; one thread open at a time in a slot   |
| `CursorPresence`                              | Remote cursors and selections, the name always written, stepped movement, none with reduced motion                         |
| `StrokePicker`, `FillPicker`, `PatternSwatch` | Colour, width, dash, ends, opacity with a preview; fill none, solid or one of eight dither patterns                        |
| `ShortcutsSheet`                              | A dialog of shortcuts by section, searchable, built from the same `Action[]` as `useActions`; Ctrl or ⌘ per platform       |
| `Tour`                                        | Coachmarks on targets (selector, ref or function): target lit, next / back / skip, dots, focus kept, Escape skips          |
| `OnboardingChecklist`                         | Steps with a done mark, a bar, the next one marked, an action and Mark done on each; folds, dismisses                      |

Dashboard and analytics blocks, app-agnostic (nothing knows what is measured: the page passes numbers and turns a query into data; `src/blocks/dashboard-*`). Charts are pixels on or off (dither steps, scan lines), each with a text alternative and a key that does not rely on colour.

| Block                                                  | What it is                                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Funnel`, `dashboardFunnel`                            | Stages as stepped bars with count and conversion from the stage before; overall conversion                                                        |
| `Heatmap`, `dashboardHeatLevel`                        | A matrix or a calendar in five dither steps; a grid walked with the arrows; the scale in numbers                                                  |
| `Donut`, `dashboardRing`                               | A pixel ring cut into slices, six fill patterns; the key gives value and share, and spotlights a slice                                            |
| `Gauge`, `dashboardGaugeState`                         | A value against a target on a half ring; the state is a word (Behind, Close, On target), `role="meter"`                                           |
| `StackedBar`, `dashboardStack`                         | Horizontal or vertical bars split into series; the key turns a series on or off; shares with `normalize`                                          |
| `ColumnChart`                                          | Columns over time from zero; the previous period as a dithered ghost beside each column, a target as a rule, a key; arrows read a column          |
| `Waffle`, `dashboardWaffle`                            | Shares as a grid of squares (100 by default, largest remainder); each slice its own pattern; the key gives value and share and spotlights         |
| `StatusStrip`, `dashboardStatusSummary`                | States over time, one cell per period (uptime, runs); the worse, the taller and heavier the pixels; share up, counts per state, arrows read one   |
| `BulletChart`, `dashboardBullet`                       | Measures against targets, one row each: a bar over dithered bands, the target as a tick, the share of it in words, `role="meter"`                 |
| `Waterfall`, `dashboardWaterfall`                      | From a start to an end through its changes; subtotals; a rise scan lines, a fall a checker; the scale is cut (and says so) when changes are small |
| `Dumbbell`, `dashboardExtent`                          | Before and after on one scale, a row each; the segment in the tone of the change, the change written with arrow and sign; sorts by change         |
| `DivergingBar`                                         | Values around a central zero, left or right; named sides (Under budget, Over budget); the tone follows which side is good news                    |
| `Histogram`, `dashboardHistogram`                      | The spread of raw values in round-width bins; p50 and p95 rules; the tail past a threshold in ember, with its share                               |
| `markers` on `LineChart`, `ColumnChart`, `StatusStrip` | Events at points: a numbered flag and rule over the point, a key under the axis, the event in the readout                                         |
| `WidgetGrid`, `dashboardPlace`, `dashboardSync`        | 12 columns of widgets, layout as plain data; edit mode: drag, resize corner, arrows (Shift resizes), push-down collisions; one column when narrow |
| `WidgetFrame`                                          | Title, subtitle, menu, loading (skeleton), error with retry, empty, full size in a dialog, drag handle slot                                       |
| `DateRangeCompare`, `dashboardCompareRanges`           | A period and what it is compared to (previous period, previous year, custom) and the two ranges it gives                                          |
| `DeltaBadge`, `dashboardRatio`, `dashboardDeltaWay`    | A change as an arrow, a sign and a word (Better, Worse, Flat); tone only repeats it                                                               |
| `MetricPicker`, `dashboardQueryText`                   | A measure, a grouping (with a slice of time) and filters, as a serialisable `DashboardQuery`; fetches nothing                                     |

Time and scheduling blocks, app-agnostic (agenda, time off, bookings, shifts, resource planning; `src/blocks/time-*`). Dates are `YYYY-MM-DD`, times `HH:mm` (`24:00` ends a day), zones are IANA names; the pure helpers (`layoutOverlaps`, `snapMinutes`, `expandRecurrence`, `convertTime`, `daySlots`, `findConflicts`…) are exported too:

| Block                             | Use                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `TimeGrid`                        | Day, work week, week or resource columns of hours: overlaps, all-day row, now line, create / move / resize |
| `AvailabilityEditor`              | Weekly hours with several ranges a day, copy to days, date exceptions, time zone                           |
| `SlotPicker`                      | A day strip or month, then the free times in the viewer's zone, taken ones struck; for bookings            |
| `RecurrenceEditor`                | Every n days, weeks, months or years, weekdays, end; the sentence and the next dates (RRULE in and out)    |
| `TimezonePicker`, `DurationInput` | A zone found by typing with its offset and local time; hours and minutes with presets                      |
| `ResourceSchedule`                | Rows per person or resource over days, clashes marked; a preset on `Timeline`                              |

Conversation blocks, app-agnostic (chat, mail, helpdesk, comments, portals; `src/blocks/conversation-*`). Messages are `{ id, at, author, body, … }`, a string body reads `**bold**`, `*italic*`, `` `code` ``, links and `@[Name](id)` mentions (never HTML); the pure helpers (`buildConversationRows`, `findMentionTrigger`, `insertMention`, `applyConversationFormat`, `parseRecipientText`…) are exported too. Emoji glyphs appear only as user content (reactions), the interface stays pixel icons:

| Block                                                                                           | Use                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MessageList`, `MessageItem`                                                                    | Runs by author and day, new-messages divider, quotes, reactions, threads, sending / failed / edited / deleted, files; stays at the bottom, Jump to latest, arrows between messages, a menu per message |
| `RichComposer`                                                                                  | Textarea with `@` / `#` pickers and a slash hook, markdown keys (⌘B, ⌘I, ⌘E), files, preview, reply bar, Enter or ⌘↵ sends                                                                             |
| `MentionPicker`, `EmojiPicker`, `ReactionBar`                                                   | The list at the caret (focus stays in the box); emoji search, categories, recents; counts, who reacted, toggle, add                                                                                    |
| `ThreadPanel`                                                                                   | Root message, replies, composer, close (Escape)                                                                                                                                                        |
| `ConversationList`                                                                              | Avatars and presence, preview, time, unread, pinned, muted, typing, sections; arrows and Enter                                                                                                         |
| `RecipientInput`, `RecipientFields`                                                             | To, Cc, Bcc: tags with suggestions, groups that expand, invalid marked, many addresses pasted at once                                                                                                  |
| `TypingIndicator`, `PresenceDot`, `AttachmentList`                                              | Who is writing (polite live region); a square and a word; files with progress, retry, remove, download                                                                                                 |
| `FormBuilder`, `QuestionCard`                                                                   | Forms: pages and questions edited in place, add menu by type, drag or Alt + arrows (across pages), show-if logic with ConditionBuilder, live preview; value is a plain `FormSchema`                    |
| `FormRenderer`, `FormQuestionField`                                                             | Forms: a schema as the respondent's form: 15 question types, pages with progress, messages, conditional questions, review step, typed answers to `onSubmit`                                            |
| `MatrixField`, `RankingField`, `AddressField`                                                   | Forms: rows against columns; items put in order (Alt + arrows); a postal address, no lookup. Usable alone                                                                                              |
| `ResponseSummary`, `ShareLinkPanel`                                                             | Forms: a mini-chart per question (bars, histogram, NPS, texts, matrix) and the link and embed code of a form                                                                                           |
| `summarizeForm`, `validateFormAnswers`, `formVisibility`, `parseFormAnswer`, `formResponseGrid` | Forms: pure helpers (no React): summary, validation, what is shown, text to answer, responses as DataGrid rows                                                                                         |

Administration blocks, app-agnostic (a console, a people directory or any app with settings; `src/blocks/admin-*`). No roles: a subject holds states, and inherits the rest. No network: the blocks call back and the app answers. Secrets are never in the page unless asked for, and the examples use fake values (`fg_test_xxxxxxxx`).

| Block                                                                                                                                                                                                                                                             | Use                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PermissionMatrix`, `permissionDiff`                                                                                                                                                                                                                              | Subjects by permissions, each cell allow, deny or inherit; bulk by row or column; a grid for the keyboard; read-only, diff of unsaved changes, text summary                                                                                             |
| `NotificationPreferences`                                                                                                                                                                                                                                         | Events by channels, a switch per group and channel, digest, quiet hours (`inQuietHours`), reset to default                                                                                                                                              |
| `InviteDialog`, `classifyInvites`                                                                                                                                                                                                                                 | Emails in a tag field (paste many, each checked), teams, a message, then invited / already a member / invalid                                                                                                                                           |
| `TokenManager`                                                                                                                                                                                                                                                    | Tokens with scopes, last use and expiry; create (name, scopes, expiry); shown once with a copy-now warning; revoke after a confirmation                                                                                                                 |
| `SecretField`                                                                                                                                                                                                                                                     | A masked secret of fixed length: reveal for a few seconds, copy, replace, remove, set or not set; the value is read on demand                                                                                                                           |
| `EndpointList`, `DeliveryLog`                                                                                                                                                                                                                                     | Webhook endpoints (events, status, switch, test, signing secret) and their deliveries (code, duration, tries, JSON payload and answer, redeliver)                                                                                                       |
| `ExportDialog`                                                                                                                                                                                                                                                    | Format, columns, range and a preview count; progress and the download are reported through `state`                                                                                                                                                      |
| `TrashList`                                                                                                                                                                                                                                                       | Deleted items with who, when and days left; restore, delete forever and empty after a confirmation; selection                                                                                                                                           |
| `Tree`                                                                                                                                                                                                                                                            | Structure: a generic ARIA tree for any node (`renderItem`): lazy children, one or several selected, drag with a drop line or Alt + arrows to reorder and reparent (`onMove` gives the new tree), F2 rename, right-click menu, counts, filter with marks |
| `Outline`                                                                                                                                                                                                                                                         | Structure: the table of contents from `headings` or read from an element (`from`); nested by level, scroll-spy, click scrolls, branches and panel fold                                                                                                  |
| `OrgChart`, `OrgCardBody`                                                                                                                                                                                                                                         | Structure: people or units as cards joined by pixel connectors, folds, selection, arrow keys, compact or detailed cards, vacancies; scrolls, no pan or zoom                                                                                             |
| `TemplateGallery`                                                                                                                                                                                                                                                 | Structure: templates in a grid with search, categories, a blank entry first and a preview pane; `onChoose(id \| null)`                                                                                                                                  |
| `CoverPicker`, `CoverArt`                                                                                                                                                                                                                                         | Structure: a page banner: nine generated pixel patterns in three token tones, a picture uploaded (`FileInput`) or linked, its position dragged or set with arrows, remove                                                                               |
| `InlineComments`                                                                                                                                                                                                                                                  | Structure: comment threads in the margin, anchored to a block or a text range by id and offsets, laid out beside the anchors without overlap; open / resolved, reply (`RichComposer`, mentions), resolve, reopen, a draft for a new thread              |
| `DiffView`, `FieldDiff`                                                                                                                                                                                                                                           | Structure: a line diff of two texts (Myers, no dependency), unified or side by side, changed words marked, long unchanged runs folded; and the fields of two records, before → after                                                                    |
| `VersionCompare`                                                                                                                                                                                                                                                  | Structure: the versions in a list; pick two (From, To) and see the text or field diff, restore an older one                                                                                                                                             |
| `structureMove`, `structureShift`, `structureFlatten`, `structureFilter`, `structureHeadingsFrom`, `structureOrgLayout`, `structureRebaseAnchor`, `structureLayoutThreads`, `structureDiffSeq`, `structureDiffRows`, `structureDiffFields`, `structureCoverCells` | Structure: pure helpers (no React): tree moves and flattening, headings, org layout, comment anchors and layout, diff, cover pixels                                                                                                                     |

## Layers

Primitives (`src/*.tsx`, shadcn's composite shape, D-156) sit below the blocks (`src/blocks/`, the domain: issues, invoices, automations…); a primitive never imports a block (rule `ui-primitives-do-not-import-blocks`, D-157). The charts are in `src/charts/`, with shadcn's `ChartContainer`, `ChartTooltip` and `ChartLegend`. New names are exported through `src/parts-<group>.ts` and styled in `src/parts-<group>.css`.

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

The pixel effects of the Forgeron sites, in `src/shaders/`: the dither field (canvas), the WebGL field modes (ember, field, globe, dissolve), the dithered image, the hearth, the pixel reveal. Each one is a framework-free `mount…` function and a React component (`DitherField`, `FieldShader`, `DitheredImage`, `Hearth`, `PixelReveal`) that draws a still frame under reduced motion. They take the shader source and the Bayer matrix from `@forgeron/shaders`, and the bitmap face from `@forgeron/font`.

Every atom and block, with live examples, its code and its props: `apps/ui-gallery` (`ui.forgeron.sh`, `bun run --cwd apps/ui-gallery dev`, port 5181).

Import `@forgeron/ui/styles.css` once. Components are stateless and render on the client (server rendering is out of scope).

## With shadcn

Every atom, block and hook is also an item of a shadcn registry served by the gallery (D-156): `npx shadcn@latest add https://ui.forgeron.sh/r/<slug>.json` copies the sources under `components/forgeron/`, with the icons they use, our private packages vendored, and the stylesheet (`forgeron` item). In that copy our tokens are `--fg-*` and read the host's shadcn variables (`--background`, `--primary`, `--border`, `--radius`…), the styles sit in `@layer components` so Tailwind utilities win, and `forgeron-theme` writes our palette into those variables. Most primitives also take shadcn's shape (D-156): a root keeps its props-driven form when given its own prop (`title`, `options`, `tabs`, `items`, `label`, `columns`, `name`, `keys`…) and is the root of shadcn's parts without it (Dialog, Select, Tabs, Popover, Tooltip, Drawer, ContextMenu, Accordion, Collapsible, Breadcrumb, Avatar, Table, Checkbox, Switch, RadioGroup, Slider, Progress, Kbd); Badge and Skeleton take shadcn's props directly; DropdownMenu, Sheet, AlertDialog, Card, Alert, Toggle, ToggleGroup, Pagination, ScrollArea, HoverCard, Label and Command are shadcn's own. The parts sit in the root's file and are built on Base UI; triggers take `asChild`. New parts are exported through `src/parts-<group>.ts` and styled in `src/parts-<group>.css`. `cn` (clsx shapes, no Tailwind merge) is exported next to `cx`; `Button` takes `asChild` and shadcn's `default`, `outline`, `destructive`, `link` and `icon` names. The registry is built from these sources by `apps/ui-gallery/src/lib/shadcn/`: nothing to keep in sync by hand.

## Notes

Does not import the SDK (rule `ui-does-not-import-sdk`). The parts that open over the page use Base UI for their behaviour (D-147); their look is ours. `react` is a peer dependency. Brand: `docs/design-system.md`.
