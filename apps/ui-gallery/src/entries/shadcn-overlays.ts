import type { Atom } from "../types";

/** Gallery entries of the shadcn components new in the "overlays" group (D-156). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "sheet",
    name: "Sheet",
    summary:
      "A panel that slides in from an edge of the screen, over a scrim, as shadcn composes it.",
    imports: [
      "Sheet",
      "SheetTrigger",
      "SheetContent",
      "SheetHeader",
      "SheetFooter",
      "SheetTitle",
      "SheetDescription",
      "SheetClose",
    ],
    props: [
      {
        name: "side (SheetContent)",
        type: `"top" | "right" | "bottom" | "left"`,
        default: `"right"`,
        description: "The edge it slides in from.",
      },
      {
        name: "showCloseButton (SheetContent)",
        type: "boolean",
        default: "true",
        description: "The close button in the corner.",
      },
      {
        name: "asChild (SheetTrigger, SheetClose)",
        type: "boolean",
        description: "Draws your own element, a Button, as the trigger.",
      },
      {
        name: "open / defaultOpen / onOpenChange (Sheet)",
        type: "boolean / boolean / (open) => void",
        description: "Controlled or not. Focus is trapped; Escape closes it.",
      },
    ],
  },
  {
    slug: "alert-dialog",
    name: "Alert dialog",
    summary: "A modal that asks to confirm a destructive or irreversible action.",
    imports: [
      "AlertDialog",
      "AlertDialogTrigger",
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogFooter",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogAction",
      "AlertDialogCancel",
    ],
    props: [
      {
        name: "open / defaultOpen / onOpenChange (AlertDialog)",
        type: "boolean / boolean / (open) => void",
        description: "Controlled or not. A click outside does not close it; Escape cancels.",
      },
      {
        name: "AlertDialogAction",
        type: "button props, asChild",
        description: "The confirming button, in the primary look; closes the dialog.",
      },
      {
        name: "AlertDialogCancel",
        type: "button props, asChild",
        description: "The cancelling button, outlined; closes the dialog.",
      },
    ],
  },
];
