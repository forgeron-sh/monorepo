# `@forgeron/ui`: finishing the move to shadcn composition, in waves

The plan for closing the work started by D-156, D-157 and D-160. Each wave is a set of tasks given to
separate agents with disjoint files; the orchestrating session wires the shared files and commits.

**Status (21/11/2026)**: done. Waves 1, 2, 3 and 5 are recorded in D-161, wave 4 in D-162 (finance,
the Data hub and four admin screens left `ui`), the gallery's scope in D-163, waves 6 to 9 (every
primitive and block in parts) in D-164. Left out of wave 3 on purpose: `dashboard-widget-grid` (a 2D layout).

## Conventions every task follows

- **The shape.** A component with an inner structure is a set of compound parts, as in shadcn: a root
  and named parts (`XTrigger`, `XContent`, `XItem`…), each taking `className` and `...rest` and, where
  it renders one element, `asChild` (`src/part.tsx`, D-164) or Base UI's `render`. Controlled or not
  through `useControllableState` (`src/hooks`). Base UI (`@base-ui/react`) underneath where it has
  the widget.
- **Both APIs under one name.** The props form people use today keeps working: the root recognises it
  by one prop (as `Dialog` by `title`, `Combobox` by `options`) and builds it from the parts; the
  parts' root type declares that prop `?: undefined`. No consumer changes needed.
- **References.** `src/dialog.tsx`, `src/select.tsx`, `src/combobox.tsx`, `src/tree.tsx` for the
  shape; `src/parts-menus.ts` and `src/parts-menus.test.ts` for a barrel and its tests;
  `docs/DECISIONS.md` D-156, D-157, D-160.
- **Files.** Parts stay in the component's file, its pure logic in `src/<name>-model.ts` when there is
  some. A task may add a barrel `src/parts-<group>.ts` and its stylesheet `src/parts-<group>.css`,
  but never edits `src/index.ts`, `src/styles.css`, `apps/ui-gallery/src/registry.ts` or
  `apps/ui-gallery/src/lib/shadcn/*`: it lists in its report what to export and import there.
- **Layering.** Primitives never import blocks (`ui-primitives-do-not-import-blocks`).
- **Gallery.** Add at least one `NN-composed.tsx` example to the component's folder in
  `apps/ui-gallery/src/examples/<slug>/` (found automatically). Edit the component's entry in
  `apps/ui-gallery/src/entries/*.ts` only with small edits (other tasks touch the same files), to
  document the parts.
- **Checks per task.** `bunx tsc --noEmit -p packages/ui`, `bunx tsc --noEmit -p apps/ui-gallery`,
  `bunx vitest run <the touched test files>`, `bunx oxfmt <files>`, `bunx oxlint <files>`, with
  `~/.proto/shims` first in `PATH`. Never `bun run check` (one at a time, the orchestrator runs it).
  No commit.

## Wave 1: primitives with a real structure that are still props-only

| Task             | Files                                                                                                                      | Target                                                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1a Menus         | `menu.tsx`, `action-menu.tsx`, `modal.tsx`, `command-palette.tsx` (reads `command.tsx`, `dropdown-menu.tsx`, `dialog.tsx`) | `Menu` and `ActionMenu` become presets over `DropdownMenu` parts, `Modal` over `Dialog`, `CommandPalette` over `Command` parts in a `Dialog`. No second implementation of a menu or a modal left.                               |
| 1b Dates         | `calendar.tsx`, `time.tsx`, `overlays.tsx` (`DatePicker`, `Toaster`, `SelectMenu` already done)                            | `Calendar` in parts (header, grid, day), `DatePicker`/`DateRangePicker` as `Popover` + `Calendar` parts, `TimePicker` in parts; `Toaster` parts (`Toast`, `ToastTitle`, `ToastDescription`, `ToastAction`).                     |
| 1c Data grid     | `data-grid.tsx`                                                                                                            | `DataGrid` in parts over `Table` parts (`DataGridHeader`, `DataGridRow`, `DataGridCell`…), `Pager` over `Pagination`, `ConstraintChip` stays.                                                                                   |
| 1d Shell         | `shell.tsx`, `split-pane.tsx`, `settings.tsx`                                                                              | `AppShell`, `Sidebar` (`SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`…, as shadcn), `Nav`; `SplitPane` parts (`SplitPanePanel`, `SplitPaneHandle`); `Settings` parts. |
| 1e Inputs        | `stepper.tsx`, `rating.tsx`, `otp-input.tsx`, `numbers.tsx`, `file-input.tsx`, `color-picker.tsx`                          | Parts where there is a structure (OTP slots and groups as shadcn's InputOTP, number input with its steppers, currency picker over `Select`, file input over `DropZone` parts, color picker swatches and input).                 |
| 1f Views of data | `diff.tsx`, `tool-card.tsx`, `board.tsx`                                                                                   | `Diff` parts (`DiffLine`, `DiffHunk`, field diff), `ToolCard` parts and `DetailList` (`DetailListItem`, term and value), `Board` parts (columns, cards).                                                                        |

## Wave 2: the single-element atoms, and the barrels

- **2a Atoms (mechanical).** `className` and `...rest` (and `asChild` where it is one element) on
  `Chip`, `Tag`, `Led`, `Banner`, `Eyebrow`, `Title`, `SectionHead`, `Stat`, `Icon`, `Logo`,
  `LogoTile`, `MarkBadge`, `SoonTag`, `PixelText`, `PixelTitle`, `PixelFigure`, `CopyBlock`,
  `CommandLine`, `Markdown`, `Page`, `Notice`, `EmptyState`, `Spinner`. One test that each forwards.
- **2b Barrels.** `Popover`, `Tabs` and `Tooltip` are parts already but in no `parts-*` barrel; the
  barrels of wave 1 land; `index.ts` ordered by barrel.

## Wave 3: blocks still carrying their own mechanics

- **3a Pickers on Combobox.** `conversation-recipients`, `datahub-relation-picker`,
  `automation-step-picker`, `filtering-picker`, `filtering-filter-bar`, `finance-product-picker`.
- **3b Trees and lists.** `structure-outline` on `Tree` and `Sortable`; `dashboard-widget-grid`,
  `finance-line-items` on `Sortable`.
- **3c Grids.** `admin-permission-matrix` on `Table` parts and `useCollection`; `datahub-record-grid`
  on records: the kinds `boolean`, `relation`, `file`, `json` added to `defineFields`.
- **3d Time.** `time-availability`, `time-grid`, `time-recurrence`, `time-resources`, `time-slots` on
  the date parts of wave 1.
- Kept apart on purpose: `structure-org-chart` (2D), the `editor-*` canvas blocks, `marketing-*`.

## Wave 4: what belongs in `ui` (a decision with the owner, not a task)

The rule: a block stays when it makes sense in several kinds of internal tools (a signature block, a
file browser, a comment thread); it leaves when it only makes sense for one domain or for Forgeron's
own platform. Leaving means moving into the app or the template that uses it, or into a preset built
from generic blocks. A first sort, to decide together:

| Likely kept                                                                                                                                | To decide                                                                                                                                          | Likely out of `ui`                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| approval (signing), drive, conversation, forms, records, views, time, filtering, navigation, record, editor toolbars and panels, marketing | automation (a workflow builder), dashboard, structure (template gallery, cover picker, org chart), lists issue presets, editor tour and onboarding | admin endpoints, delivery log, token manager, notification preferences (Forgeron's platform), datahub (Forgeron's Data hub), finance (invoices, statements), projects table |

## Wave 5: closing

- Remove the deprecated aliases (`TreeRoot`…) once nothing uses them.
- Check every `/r/<item>.json` installs into a blank shadcn project.
- Walk the gallery in a browser: every new composed example, light and dark, phone width.
- `docs/DECISIONS.md`: one entry for waves 1 to 3, one for the decision of wave 4.

## Wave 9: every block in shadcn parts (21/11/2026)

The owner's rule: every block is composed from the primitives as much as possible (a missing
primitive is created, generic, in `src/`), and is itself in shadcn's format: a root and named
parts, both APIs under one name, as the primitives (see "Conventions").

- **Shape of a block.** `IssueBoard` keeps its props (`issues`, `onMove`…) and becomes the
  shorthand of its parts (`IssueBoard` without its data prop is the root; `IssueBoardColumn`,
  `IssueBoardCard`…). Name the parts after the block (`ProjectsTableRow`, `SlotPickerDay`,
  `AvailabilityEditorDay`…). Each part: `className`, `...rest`, `data-slot`, `asChild` where it is
  one element. State shared between parts goes through a context (`useXxx` hook exported when a
  consumer needs it). The model (`*-model.ts`) stays pure.
- **Primitives first.** Lists with keyboard → `useCollection`; reorder → `useSortable`; trees →
  `Tree`; popups → `Popover`/`Dialog`/`DropdownMenu` parts; tables → `Table` parts; boards →
  `Board` parts; pickers → `Combobox`/`Select` parts; dates → the date parts; feeds → `Feed`; states →
  `Status`. A new primitive goes in a new file under `src/` with its barrel `src/parts-<name>.ts`;
  an existing primitive that lacks something is reported, not edited (another task owns them).
- **Files of a task.** Its groups' `blocks/<group>-*.tsx`, `blocks/<group>.ts` (barrel: export the
  new parts), `blocks/<group>.css`, `blocks/<group>-blocks.test.ts`, the gallery's
  `apps/ui-gallery/src/entries/<group>.ts` and `src/examples/<slug>/` of its blocks. The composed
  example is `01-default.tsx`, the props shorthand after. Never `src/index.ts`, `src/styles.css`,
  `apps/ui-gallery/src/registry.ts`, `apps/ui-gallery/src/lib/shadcn/*`.
- **Removed**: `RunDetail` (automation): little use.
