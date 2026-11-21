import type { Atom } from "../types";

/** Gallery entries of the shadcn components new in the "forms" group (D-156). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "toggle",
    name: "Toggle",
    summary: "A button that stays pressed, flat or outlined.",
    imports: ["Toggle"],
    props: [
      {
        name: "pressed / defaultPressed",
        type: "boolean",
        description: "Controlled or initial state.",
      },
      {
        name: "onPressedChange",
        type: "(pressed: boolean) => void",
        description: "Fires on each change.",
      },
      {
        name: "variant",
        type: '"default" | "outline"',
        default: '"default"',
        description: "Flat or with a border.",
      },
      {
        name: "size",
        type: '"default" | "sm" | "lg"',
        default: '"default"',
        description: "32, 28 or 40px high.",
      },
      { name: "className", type: "string", description: "Merged with the component's classes." },
    ],
  },
  {
    slug: "toggle-group",
    name: "Toggle group",
    summary: "A row of toggles, one or several pressed at once.",
    imports: ["ToggleGroup", "ToggleGroupItem"],
    props: [
      {
        name: "ToggleGroup",
        type: "value / defaultValue: string[], onValueChange",
        description: 'The pressed values. multiple (or type="multiple") lets several be pressed.',
      },
      {
        name: "variant / size",
        type: "as Toggle",
        description: "On the group; the items inherit them.",
      },
      {
        name: "ToggleGroupItem",
        type: "value: string",
        description: "One toggle; a Toggle with the group's look.",
      },
      { name: "className", type: "string", description: "Merged with the component's classes." },
    ],
  },
  {
    slug: "input-group",
    name: "Input group",
    summary: "One frame around an input and what sits beside it: an icon, a unit, a button.",
    imports: [
      "InputGroup",
      "InputGroupAddon",
      "InputGroupInput",
      "InputGroupTextarea",
      "InputGroupButton",
      "InputGroupText",
    ],
    props: [
      {
        name: "InputGroup",
        type: "div",
        description:
          "The frame: it draws the border and the focus ring; the control inside is bare.",
      },
      {
        name: "InputGroupAddon",
        type: '"inline-start" | "inline-end" | "block-start" | "block-end"',
        default: '"inline-start"',
        description: "align: before or after the control, or on a line above or below it.",
      },
      {
        name: "InputGroupInput / InputGroupTextarea",
        type: "input / textarea",
        description: "The control. SearchBox is a preset over these parts.",
      },
      {
        name: "InputGroupButton",
        type: '"xs" | "sm" | "icon-xs" | "icon-sm"',
        default: '"xs"',
        description: "A small Button for an addon (size, variant: ghost by default).",
      },
      { name: "className", type: "string", description: "Merged with the component's classes." },
    ],
  },
];
