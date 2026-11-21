/* Blocks of the "editor chrome and guidance" group: the pieces around a canvas or document editor, and onboarding. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const mac: PropRow = {
  name: "mac",
  type: "boolean",
  description: "Reads ⌘ (true) or Ctrl (false) in the hints. Default: from the platform.",
};

/** Gallery pages of the "editor" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "canvas-toolbar",
    name: "Canvas toolbar",
    summary:
      "The tool dock of an editor: grouped tools, an active one, variants in a menu, undo and redo. Horizontal or vertical.",
    imports: [
      "CanvasToolbar",
      "formatShortcut",
      "CanvasToolbarTools",
      "CanvasToolbarTool",
      "CanvasToolbarSeparator",
      "CanvasToolbarUndo",
      "CanvasToolbarRedo",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: CanvasToolbarTools (every tool), CanvasToolbarTool (one, by `tool`), CanvasToolbarSeparator, CanvasToolbarUndo, CanvasToolbarRedo, in any order. Other children go at the end of the usual dock.",
      },
      { name: "label", type: "string", description: "Names the dock: “Drawing tools”." },
      {
        name: "tools",
        type: "{ id, label, icon, shortcut?, group?, variants?, disabled? }[]",
        description:
          "Tools with the same group sit together, a line between groups. variants: { id, label, icon?, shortcut? }[] in a menu beside the tool; the one chosen gives its icon to it.",
      },
      {
        name: "value / defaultValue / onChange",
        type: "string; string; (id) => void",
        description: "The active tool. Controlled or not.",
      },
      {
        name: "variants / defaultVariants / onVariantChange",
        type: "Record<toolId, variantId>; (toolId, variantId) => void",
        description: "The variant chosen for each tool.",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description:
          "Arrows move between tools (one tab stop); vertical puts tooltips and menus to the side.",
      },
      {
        name: "onUndo / onRedo / canUndo / canRedo",
        type: "() => void; boolean",
        description: "Undo and redo buttons at the end. ⌘Z and ⇧⌘Z are bound with them.",
      },
      {
        name: "shortcuts",
        type: "boolean",
        default: "true",
        description:
          "Binds each tool's key on the page (not while typing). Hints show in the tooltip.",
      },
      mac,
      {
        name: "floating",
        type: "boolean",
        description: "The shadow of a panel lifted off the canvas.",
      },
      { name: "children", type: "ReactNode", description: "More controls at the end of the dock." },
      className,
    ],
  },
  {
    slug: "zoom-controls",
    name: "Zoom controls",
    summary:
      "Zoom out, the percent with a menu (presets, fit, fill, 100%), zoom in, with shortcut hints.",
    imports: [
      "ZoomControls",
      "editorStepZoom",
      "editorFitZoom",
      "editorFillZoom",
      "editorZoomText",
      "editorParseZoom",
      "editorZoomAround",
      "EDITOR_ZOOM_STEPS",
      "ZoomControlsOut",
      "ZoomControlsValue",
      "ZoomControlsIn",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: ZoomControlsOut, ZoomControlsValue (the percent and its menu), ZoomControlsIn, in any order. Other children go after zoom in.",
      },
      { name: "zoom", type: "number", description: "1 = 100%." },
      {
        name: "onZoomChange",
        type: "(zoom: number) => void",
        description: "Every change, kept inside min and max.",
      },
      {
        name: "onFit / onFill",
        type: "() => void",
        description:
          "Add “Zoom to fit” and “Zoom to fill” to the menu: the canvas works the zoom out (editorFitZoom, editorFillZoom).",
      },
      {
        name: "presets",
        type: "number[]",
        default: "[0.25, 0.5, 1, 2]",
        description: "The zooms listed in the menu; the current one is ticked.",
      },
      {
        name: "min / max / steps",
        type: "number; number[]",
        description: "The limits and the steps of + and −.",
      },
      {
        name: "shortcuts",
        type: "{ zoomIn, zoomOut, reset, fit, fill }",
        description: "The keys shown (⌘+, ⌘−, ⌘0, ⇧1, ⇧2 by default).",
      },
      {
        name: "bindShortcuts",
        type: "boolean",
        default: "false",
        description: "Binds those keys on the page; a canvas often handles its own.",
      },
      mac,
      className,
    ],
  },
  {
    slug: "minimap",
    name: "Minimap",
    summary:
      "A miniature of the world with the viewport as a rectangle: drag to pan, click to jump, corner to zoom, arrows for the keyboard.",
    imports: [
      "Minimap",
      "editorMinimapFit",
      "editorToMap",
      "editorFromMap",
      "editorPanViewport",
      "editorScaleViewport",
      "editorBoundsOf",
      "MinimapCanvas",
      "MinimapViewport",
      "MinimapHandle",
      "MinimapStatus",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: MinimapCanvas (world and items), MinimapViewport (the rectangle) holding MinimapHandle, MinimapStatus. Without them: all four.",
      },
      { name: "label", type: "string", description: "Names the map: “Canvas overview”." },
      {
        name: "items",
        type: "{ id, x, y, w, h, tone? }[]",
        description: "Drawn as plain rectangles, in world units. tone: default, accent or muted.",
      },
      {
        name: "world",
        type: "{ x, y, w, h }",
        description: "The area shown. Default: the items' bounds with a margin.",
      },
      {
        name: "viewport",
        type: "{ x, y, w, h }",
        description: "What is on screen, in world units.",
      },
      {
        name: "onViewportChange / onViewportCommit",
        type: "(viewport) => void",
        description:
          "While dragging, resizing or pressing keys; and when it ends. Without onViewportChange the map only shows.",
      },
      {
        name: "width / height",
        type: "number",
        default: "200 / 140",
        description: "The map in px.",
      },
      {
        name: "resizable",
        type: "boolean",
        default: "true",
        description: "A corner handle, and + / − keys, scale the viewport around its centre.",
      },
      {
        name: "limits",
        type: "{ minW, maxW }",
        description: "How wide the viewport can get, in world units.",
      },
      {
        name: "step",
        type: "number",
        description:
          "World units per arrow press (Shift: five times). Default a tenth of the viewport.",
      },
      className,
    ],
  },
  {
    slug: "layers-panel",
    name: "Layers panel",
    summary:
      "The layers of a canvas as a tree: groups, visibility, lock, rename, multi-select, reorder by drag or Alt + arrows.",
    imports: [
      "LayersPanel",
      "editorFlattenLayers",
      "editorMoveLayer",
      "editorReorderLayer",
      "editorIndentLayer",
      "editorOutdentLayer",
      "editorUpdateLayer",
      "editorFindLayer",
      "LayersPanelTree",
      "LayersPanelRow",
      "LayersPanelGrip",
      "LayersPanelFold",
      "LayersPanelMark",
      "LayersPanelName",
      "LayersPanelKind",
      "LayersPanelExtra",
      "LayersPanelLock",
      "LayersPanelVisibility",
      "LayersPanelEmpty",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: LayersPanelTree with a function of the row returning a LayersPanelRow holding LayersPanelGrip, Fold, Mark, Name, Kind, Extra, Lock, Visibility. Without them: the usual rows.",
      },
      { name: "label", type: "string", description: "Names the tree: “Layers”." },
      {
        name: "layers / defaultLayers / onChange",
        type: "{ id, name, visible?, locked?, kind?, children? }[]",
        description:
          "First is on top. A layer with children is a group. onChange gets the whole new tree after a rename, toggle, reorder or move.",
      },
      {
        name: "selected / defaultSelected / onSelectedChange",
        type: "string[]",
        description:
          "Click selects, ⌘ click adds, Shift click extends; Space toggles, Enter selects, ⌘A all.",
      },
      {
        name: "collapsed / defaultCollapsed / onCollapsedChange",
        type: "string[]",
        description: "The folded groups (← and → fold and unfold).",
      },
      {
        name: "readOnly",
        type: "boolean",
        description: "Selection and folding only.",
      },
      { name: "empty", type: "ReactNode", description: "Written when there are no layers." },
      {
        name: "rowActions",
        type: "(layer) => ReactNode",
        description: "More at the end of a row.",
      },
      className,
    ],
  },
  {
    slug: "comment-pin",
    name: "Comment pins",
    summary:
      "Numbered markers, open or resolved, placed over a canvas from world positions, each opening a thread.",
    imports: [
      "CommentPin",
      "PinLayer",
      "editorProject",
      "editorUnproject",
      "PinLayerItem",
      "PinLayerTrigger",
      "PinLayerThread",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: one PinLayerItem per pin (`pin`, `index`) holding PinLayerTrigger (the marker) and PinLayerThread (the panel; your children replace renderThread). Without them: one per pin.",
      },
      {
        name: "CommentPin: number / state / unread / active / author",
        type: "number; “open” | “resolved”; boolean",
        description:
          "One marker. Resolved is hollow, dashed, with a tick; its label says open or resolved, and unread.",
      },
      { name: "PinLayer: label", type: "string", description: "Names the layer: “Comments”." },
      {
        name: "pins",
        type: "{ id, x, y, number?, resolved?, unread?, author?, preview? }[]",
        description: "Where each tail points: world units with a view, else pixels.",
      },
      {
        name: "view",
        type: "{ x, y, zoom }",
        description: "What the canvas shows, to project the pins (editorProject).",
      },
      {
        name: "openId / defaultOpenId / onOpenChange",
        type: "string | null",
        description: "The pin whose thread is open: one at a time.",
      },
      {
        name: "renderThread",
        type: "(pin, close) => ReactNode",
        description: "The thread, in the panel that opens beside the pin.",
      },
      {
        name: "hideResolved / threadWidth",
        type: "boolean; number",
        description: "Leave resolved pins out; the panel's width (280).",
      },
      className,
    ],
  },
  {
    slug: "cursor-presence",
    name: "Cursor presence",
    summary:
      "The other people in an editor: their cursors and selections, always with their name, moving in steps.",
    imports: [
      "CursorPresence",
      "editorPresenceTone",
      "EDITOR_PRESENCE_TONES",
      "CursorPresenceList",
      "CursorPresenceCursor",
      "CursorPresenceSelection",
      "CursorPresencePointer",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: CursorPresenceList (screen readers), and a CursorPresenceCursor per person (`cursor`) holding CursorPresenceSelection and CursorPresencePointer. Without them: all of it.",
      },
      {
        name: "label",
        type: "string",
        description: "Names the layer for assistive technology: “People here”.",
      },
      {
        name: "cursors",
        type: "{ id, name, color?, x?, y?, selection?, status? }[]",
        description:
          "x, y: the pointer. selection: { x, y, w, h } drawn dashed with the name above. color: #RRGGBB, else a token picked from the id.",
      },
      {
        name: "view",
        type: "{ x, y, zoom }",
        description: "Projects world positions; without it they are pixels.",
      },
      {
        name: "announce",
        type: "boolean",
        default: "true",
        description: "A list of who is here, read by assistive technology only.",
      },
      className,
    ],
  },
  {
    slug: "stroke-picker",
    name: "Stroke picker",
    summary: "Colour, width, dash, ends and opacity of a line, with a live preview.",
    imports: [
      "StrokePicker",
      "editorDashArray",
      "editorOpacityText",
      "StrokePickerPreview",
      "StrokePickerColor",
      "StrokePickerWidth",
      "StrokePickerDash",
      "StrokePickerCap",
      "StrokePickerOpacity",
      "StyleRow",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in any order: StrokePickerPreview, Color, Width, Dash, Cap, Opacity. StyleRow lays out a row of your own. Without them: the preview then `fields`.",
      },
      { name: "label", type: "string", description: "Names the panel: “Stroke”." },
      {
        name: "value / defaultValue / onChange",
        type: "{ color: string | null, width, dash, cap, opacity }",
        description:
          "dash: solid, dashed, dotted. cap: butt, round, square. opacity 0 to 1. A null colour is no line.",
      },
      {
        name: "fields",
        type: "(“color” | “width” | “dash” | “cap” | “opacity”)[]",
        description: "Which settings, in order. Default all five.",
      },
      {
        name: "maxWidth / preview",
        type: "number; boolean",
        default: "32 / true",
        description: "The widest line; the preview strip.",
      },
      { name: "disabled", type: "boolean", description: "Greys out the whole panel." },
      className,
    ],
  },
  {
    slug: "fill-picker",
    name: "Fill picker",
    summary: "None, a solid colour or a dither pattern, with opacity.",
    imports: [
      "FillPicker",
      "PatternSwatch",
      "EDITOR_FILL_PATTERNS",
      "editorPatternCells",
      "FillPickerType",
      "FillPickerColor",
      "FillPickerPatterns",
      "FillPickerOpacity",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: FillPickerType, FillPickerColor, FillPickerPatterns, FillPickerOpacity; each shows only when the fill has it. Without them: all of it.",
      },
      { name: "label", type: "string", description: "Names the panel: “Fill”." },
      {
        name: "value / defaultValue / onChange",
        type: "{ type: “none” } | { type: “solid”, color, opacity? } | { type: “pattern”, pattern, color, opacity? }",
        description: "A fill. Switching kind keeps the last colour.",
      },
      {
        name: "patterns",
        type: "string[]",
        description:
          "Pattern ids offered (dots-25, dots-50, dots-75, lines-h, lines-v, hatch, hatch-back, cross). Empty hides the Pattern tab.",
      },
      { name: "opacity", type: "boolean", default: "true", description: "The opacity slider." },
      { name: "disabled", type: "boolean", description: "Greys out the whole panel." },
      className,
    ],
  },
  {
    slug: "shortcuts-sheet",
    name: "Shortcuts sheet",
    summary:
      "A dialog listing the app's shortcuts by section, searchable, built from the same actions as useActions.",
    imports: [
      "ShortcutsSheet",
      "editorShortcutEntries",
      "editorGroupShortcuts",
      "useActions",
      "formatShortcut",
      "ShortcutsSheetContent",
      "ShortcutsSheetSearch",
      "ShortcutsSheetSections",
      "ShortcutsSheetSection",
      "ShortcutsSheetRow",
      "ShortcutsSheetFooter",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, on the Dialog parts: ShortcutsSheetContent (`title`) holding ShortcutsSheetSearch, ShortcutsSheetSections, ShortcutsSheetFooter. Without them: all of it.",
      },
      {
        name: "actions",
        type: "Action[]",
        description: "As given to useActions: those with a shortcut are listed under their group.",
      },
      {
        name: "entries",
        type: "{ id, label, shortcut? | keys?, group?, keywords? }[]",
        description: "More: keys that are not a combination (keys: [“Space”, “drag”]).",
      },
      {
        name: "open / defaultOpen / onOpenChange",
        type: "boolean",
        description: "Controlled or not.",
      },
      {
        name: "hotkey",
        type: "string | false",
        default: '"shift+?"',
        description: "Opens the sheet from anywhere (not while typing).",
      },
      mac,
      {
        name: "title / fallbackGroup / sectionOrder / footer",
        type: "ReactNode; string; string[]; ReactNode",
        description: "Wording, the order of sections, a note under the list.",
      },
    ],
  },
  {
    slug: "tour",
    name: "Tour",
    summary:
      "Step-by-step coachmarks anchored to targets: the target lit, next / back / skip, dots, focus managed, Escape skips.",
    imports: [
      "Tour",
      "editorTourPlacement",
      "editorTourIndex",
      "TourHeader",
      "TourCount",
      "TourClose",
      "TourTitle",
      "TourBody",
      "TourDots",
      "TourFooter",
      "TourSkip",
      "TourNav",
      "TourBack",
      "TourNext",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The card, as parts: TourHeader (TourCount, TourClose), TourTitle, TourBody, TourDots, TourFooter (TourSkip, TourNav with TourBack and TourNext). Without them: the usual card.",
      },
      { name: "label", type: "string", description: "Names the tour: “Tour of the editor”." },
      {
        name: "steps",
        type: "{ id, target?, title, body?, side?, padding? }[]",
        description:
          "target: a CSS selector, a ref or a function returning the element. Missing or not found: the card is centred. side: the preferred side; it flips if there is no room.",
      },
      {
        name: "open / defaultOpen / onOpenChange",
        type: "boolean",
        description: "Controlled or not.",
      },
      { name: "step / defaultStep / onStepChange", type: "number", description: "The step shown." },
      {
        name: "onFinish / onSkip",
        type: "() => void; (index) => void",
        description: "After Done; after Skip, Escape or the close button.",
      },
      {
        name: "interactive",
        type: "boolean",
        default: "false",
        description: "Lets the lit target take clicks.",
      },
      {
        name: "spotlight",
        type: "boolean",
        default: "true",
        description: "Dims the page around the target.",
      },
      {
        name: "labels",
        type: "{ next, back, skip, done }",
        description: "Other words for the buttons.",
      },
      className,
    ],
  },
  {
    slug: "onboarding-checklist",
    name: "Onboarding checklist",
    summary:
      "Steps to get started with a done mark, a bar of progress, an action and “Mark done” on each; folds and dismisses.",
    imports: [
      "OnboardingChecklist",
      "editorChecklistProgress",
      "editorNextStep",
      "OnboardingChecklistHeader",
      "OnboardingChecklistToggle",
      "OnboardingChecklistProgress",
      "OnboardingChecklistBody",
      "OnboardingChecklistComplete",
      "OnboardingChecklistList",
      "OnboardingChecklistStep",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: OnboardingChecklistHeader, Progress, and Body holding Complete and List (or your own OnboardingChecklistStep by `step`). Without them: all of it.",
      },
      { name: "title", type: "string", description: "The heading: “Get started”." },
      {
        name: "steps",
        type: "{ id, title, description?, done?, action?: { label, onClick } }[]",
        description: "The app owns what is done. The first step not done is marked as the next.",
      },
      {
        name: "onMarkDone / onMarkUndone",
        type: "(id) => void",
        description: "The Mark done and Undo buttons; without them, no button.",
      },
      {
        name: "onDismiss",
        type: "() => void",
        description: "The close button; the app hides the checklist.",
      },
      {
        name: "collapsed / defaultCollapsed / onCollapsedChange",
        type: "boolean",
        description: "Folds to its header and progress.",
      },
      { name: "completeMessage", type: "ReactNode", description: "Said when every step is done." },
      className,
    ],
  },
];
