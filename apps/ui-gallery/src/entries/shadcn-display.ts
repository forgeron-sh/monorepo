import type { Atom } from "../types";

/** Gallery entries of the shadcn components new in the "display" group (D-156). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "card",
    name: "Card",
    summary: "A framed block with a header, a body and a footer, as shadcn composes it.",
    imports: [
      "Card",
      "CardHeader",
      "CardTitle",
      "CardDescription",
      "CardAction",
      "CardContent",
      "CardFooter",
    ],
    props: [
      {
        name: "size (Card)",
        type: `"default" | "sm"`,
        default: `"default"`,
        description: "Tighter padding with sm.",
      },
      {
        name: "parts",
        type: "CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter",
        description:
          "Compose them in that order; CardAction sits at the top right of the header. Every part takes className and div props.",
      },
    ],
  },
  {
    slug: "alert",
    name: "Alert",
    summary:
      "A callout with a title and a description; an icon as first child gets its own column.",
    imports: ["Alert", "AlertTitle", "AlertDescription"],
    props: [
      {
        name: "variant (Alert)",
        type: `"default" | "destructive"`,
        default: `"default"`,
        description: "Destructive turns the edge and the title to the danger colour.",
      },
      {
        name: "parts",
        type: "AlertTitle, AlertDescription",
        description: "Both take className and div props. Alert has role=alert.",
      },
    ],
  },
];
