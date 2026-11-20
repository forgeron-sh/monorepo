import type { Atom } from "../types";

/** Gallery entries of the picker primitives (D-156): option lists to compose with the parts. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "picker-options",
    name: "Picker options",
    summary:
      "The lists behind StatusPicker, PriorityPicker, SizePicker, QuarterPicker and PersonPicker, to compose with Select, SelectMenu or Combobox.",
    imports: [
      "SelectMenu",
      "Select",
      "SelectTrigger",
      "SelectValue",
      "SelectContent",
      "SelectItem",
      "statusOptions",
      "priorityOptions",
      "sizeOptions",
      "quarterOptions",
      "personOptions",
    ],
    props: [
      {
        name: "statusOptions",
        type: "SelectMenuOption[]",
        description: "The six states: value is the state, glyph its mark.",
      },
      {
        name: "priorityOptions",
        type: "SelectMenuOption[]",
        description: "No priority to Low; value is the level as a string.",
      },
      {
        name: "sizeOptions(points?)",
        type: "(points?: number[]) => SelectMenuOption[]",
        description: "No estimate, XS to XL; `points` adds “n pt” hints.",
      },
      {
        name: "quarterOptions(years)",
        type: "(years: number[]) => SelectMenuOption[]",
        description: "Q1 to Q4 of each year, values like 2026-Q4, months as hint.",
      },
      {
        name: "personOptions(people, me?)",
        type: "(people: Person[], me?: string) => SelectMenuOption[]",
        description: "Avatar glyph, hint, `me` first and marked “(you)”; value is the id.",
      },
      {
        name: "SelectItem glyph / hint / checkbox",
        type: "ReactNode / ReactNode / boolean",
        description: "A mark before the text, mono text at the end, a ticking box for multiple.",
      },
      {
        name: "SelectTrigger variant",
        type: `"field" | "chip"`,
        default: `"field"`,
        description: "chip: a property of a record, 26px, no caret.",
      },
    ],
  },
];
