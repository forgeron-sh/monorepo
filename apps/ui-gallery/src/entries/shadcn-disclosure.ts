import type { Atom } from "../types";

/** Gallery entries of the shadcn components new in the "disclosure" group (D-156). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "pagination",
    name: "Pagination",
    summary:
      "Page links in a nav: previous, numbers, ellipsis, next. The current page is outlined.",
    imports: [
      "Pagination",
      "PaginationContent",
      "PaginationItem",
      "PaginationLink",
      "PaginationPrevious",
      "PaginationNext",
      "PaginationEllipsis",
    ],
    props: [
      {
        name: "PaginationLink isActive",
        type: "boolean",
        description: 'The current page: outlined, `aria-current="page"`.',
      },
      {
        name: "PaginationLink size",
        type: '"icon" | "default" | "sm" | "lg"',
        default: '"icon"',
        description: "The size of the button the link is drawn as.",
      },
      {
        name: "PaginationLink asChild",
        type: "boolean",
        description: "Draws your router's link instead of an `a`.",
      },
      {
        name: "PaginationPrevious / PaginationNext text",
        type: "ReactNode",
        default: '"Previous" / "Next"',
        description: "The label next to the arrow.",
      },
      { name: "className", type: "string", description: "On every part." },
    ],
  },
  {
    slug: "scroll-area",
    name: "Scroll area",
    summary: "A box that scrolls natively, with drawn scrollbars that show on hover and scroll.",
    imports: ["ScrollArea", "ScrollBar"],
    props: [
      {
        name: "ScrollArea",
        type: "Base UI Scroll Area Root props",
        description: "Give it a size (`className` or `style`): `h-72 w-48`, `max-height`.",
      },
      {
        name: "ScrollBar orientation",
        type: '"vertical" | "horizontal"',
        default: '"vertical"',
        description:
          "`ScrollArea` draws the vertical bar; add the horizontal one for wide content.",
      },
      { name: "className", type: "string", description: "On every part." },
    ],
  },
  {
    slug: "hover-card",
    name: "Hover card",
    summary: "A card that opens when the pointer rests on a link or the link takes focus.",
    imports: ["HoverCard", "HoverCardTrigger", "HoverCardContent"],
    props: [
      {
        name: "HoverCard open / defaultOpen / onOpenChange",
        type: "boolean / boolean / (open) => void",
        description: "Controlled or not.",
      },
      {
        name: "HoverCard openDelay / closeDelay",
        type: "number",
        default: "700 / 300",
        description: "Milliseconds before it opens and before it closes.",
      },
      {
        name: "HoverCardTrigger asChild",
        type: "boolean",
        description: "Draws your own link.",
      },
      {
        name: "HoverCardContent side / align / sideOffset",
        type: '"top" | "bottom" | "left" | "right" / "start" | "center" | "end" / number',
        default: '"bottom" / "center" / 4',
        description: "Where the card opens.",
      },
      { name: "className", type: "string", description: "On every part." },
    ],
  },
];
