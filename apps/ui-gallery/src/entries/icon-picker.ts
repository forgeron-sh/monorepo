import type { Atom } from "../types";

/** Gallery pages of the icon picker, after Notes ("Change icon") and Chat (reactions). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "icon-picker",
    name: "Icon picker",
    summary: "An icon by name: search, Recent, sections, every drawn icon. Stores a string.",
    imports: [
      "IconPicker",
      "IconPickerTrigger",
      "IconPickerContent",
      "IconPickerHeader",
      "IconPickerSearch",
      "IconPickerTones",
      "IconPickerGrid",
      "IconPickerFooter",
      "IconByName",
    ],
    props: [
      {
        name: "IconPicker parts",
        type: "IconPicker (children are parts; value / onChange, open, label, removable, random, recentsKey, tones, sections, columns, disabled), IconPickerTrigger (variant, size, placeholder), IconPickerContent, IconPickerHeader, IconPickerSearch, IconPickerTones, IconPickerGrid, IconPickerItem, IconPickerFooter",
        description:
          "The props form is built from them; compose your own as shadcn would. useIconPicker reads the state.",
      },
      {
        name: "value / defaultValue",
        type: "string | null",
        default: "null",
        description: "The icon's name, e.g. rocket-01: store it as is. Controlled or not.",
      },
      {
        name: "onChange",
        type: "(name: string | null) => void",
        description: "A pick, or null when the icon is removed.",
      },
      {
        name: "variant",
        type: `"square" | "chip" | "field"`,
        default: `"square"`,
        description:
          "A page's icon in its frame; a chip on a record; a form control with its caret.",
      },
      {
        name: "size",
        type: "number",
        default: "24",
        description: "The icon's size in the square, in px (multiples of 12).",
      },
      {
        name: "label",
        type: "string",
        default: `"Icon"`,
        description: "What the icon is for: names the trigger and the popover.",
      },
      {
        name: "placeholder",
        type: "string",
        default: `"Add icon"`,
        description: "The chip and the field without an icon.",
      },
      {
        name: "recentsKey",
        type: "string",
        description:
          "Remembers the last picks in localStorage under this key. Absent: Recent lasts as long as the picker.",
      },
      {
        name: "tones",
        type: "boolean | IconTone[]",
        default: "false",
        description: "Offers a colour: ink, muted, accent, success, warning, danger.",
      },
      {
        name: "tone / defaultTone",
        type: "IconTone",
        default: `"ink"`,
        description: "The colour, controlled or not. IconByName takes the same tone.",
      },
      {
        name: "onToneChange",
        type: "(tone: IconTone) => void",
        description: "A swatch picked.",
      },
      {
        name: "removable",
        type: "boolean",
        default: "true",
        description: "Offers Remove when an icon is set.",
      },
      {
        name: "random",
        type: "boolean",
        default: "true",
        description: "Offers a random icon next to the search.",
      },
      {
        name: "sections",
        type: "{ id, label, icons, keywords? }[]",
        default: "ICON_SECTIONS",
        description: "The sections before All icons. Names not drawn are left out.",
      },
      {
        name: "columns",
        type: "number",
        default: "10",
        description: "Icons per row; the arrows move by row.",
      },
      {
        name: "open / onOpenChange",
        type: "boolean, (open: boolean) => void",
        description: "Opens and closes the popover from outside, e.g. from a shortcut.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Drawn in the trigger in place of the icon.",
      },
      {
        name: "IconByName",
        type: "{ name, size?, tone?, title?, className? }",
        description:
          "Draws a stored name. The common set draws at once; any other loads the catalog chunk behind a dim square.",
      },
      {
        name: "loadIconCatalog",
        type: "() => Promise<IconCatalog>",
        description: "Starts the one lazy chunk of every icon early, e.g. on hover of a list.",
      },
    ],
  },
];
