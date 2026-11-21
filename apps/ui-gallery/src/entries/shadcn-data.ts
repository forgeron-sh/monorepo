import type { Atom } from "../types";

const className = { name: "className", type: "string", description: "Added to the element." };

/** Gallery entries of the shadcn components new in the "data" group (D-156). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "label",
    name: "Label",
    summary: "The label of a control, as shadcn writes it: a <label> in the field-label look.",
    imports: ["Label"],
    props: [
      { name: "htmlFor", type: "string", description: "The id of the control it names." },
      className,
    ],
  },
  {
    slug: "command",
    name: "Command",
    summary: "A search field over a list of rows: type to filter, arrows and Enter to run.",
    imports: [
      "Command",
      "CommandDialog",
      "CommandInput",
      "CommandList",
      "CommandEmpty",
      "CommandGroup",
      "CommandItem",
      "CommandSeparator",
      "CommandShortcut",
    ],
    props: [
      {
        name: "shouldFilter (Command)",
        type: "boolean",
        default: "true",
        description: "false shows every row, whatever the query.",
      },
      {
        name: "heading (CommandGroup)",
        type: "ReactNode",
        description: "The mono heading above its rows; the group hides when none matches.",
      },
      {
        name: "value, onSelect, disabled, keywords (CommandItem)",
        type: "string, (value) => void, boolean, string[]",
        description: "value is the text of the row by default; keywords find it too.",
      },
      {
        name: "open, onOpenChange, title, description (CommandDialog)",
        type: "boolean, (open) => void, string, string",
        description: "The command in a dialog; title and description are read, not drawn.",
      },
    ],
  },
  {
    slug: "eyebrow",
    name: "Eyebrow",
    summary: "The mono capitals above a section or a block.",
    imports: ["Eyebrow"],
    props: [className],
  },
  {
    slug: "command-line",
    name: "CommandLine",
    summary: "A command to type, $ npx forgeron init, framed or inline.",
    imports: ["CommandLine", "CommandLinePrompt", "CommandLineText", "CommandLineCopy"],
    props: [
      {
        name: "CommandLine parts",
        type: "CommandLine (children are parts), CommandLinePrompt, CommandLineText, CommandLineCopy value",
        description: "Without parts, CommandLine draws the prompt and its text itself.",
      },
      { name: "prompt", type: "string", default: '"$"', description: "Shown before, in ember." },
      {
        name: "framed",
        type: "boolean",
        default: "true",
        description: "false: inline in running text.",
      },
      className,
    ],
  },
];
