import type { Atom } from "../types";

/** Gallery entry of the SelectionBar primitive, extracted from the drive block (D-157). */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "selection-bar-parts",
    name: "Selection bar",
    summary:
      "The bar that appears while items are selected: how many, a way out, and the actions on them. Pairs with useCollection.",
    imports: [
      "SelectionBarRoot",
      "SelectionBarClear",
      "SelectionBarCount",
      "SelectionBarSeparator",
      "SelectionBarActions",
    ],
    props: [
      {
        name: "SelectionBarRoot",
        type: "{ count, onClear, render? } & div props",
        description:
          "A toolbar named “Selection”, drawn while `count` is 1 or more (exported as `SelectionBar` from selection-bar.tsx; `SelectionBar` in the package is the drive block built from `actions`). Escape inside it calls `onClear`.",
      },
      {
        name: "SelectionBarClear",
        type: "{ label?, asChild? } & button props",
        description:
          "The × that calls `onClear`. `asChild` gives the click to your own button; `preventDefault()` in `onClick` skips the clear.",
      },
      {
        name: "SelectionBarCount",
        type: "{ render? } & b props",
        description:
          "“3 selected”, announced politely as it changes. Give children to write something else (“3 files”).",
      },
      {
        name: "SelectionBarSeparator",
        type: "span",
        description: "The thin rule between the count and the actions.",
      },
      {
        name: "SelectionBarActions",
        type: "{ actions, onAction?, inline?, iconOnly? }",
        description:
          "The screen's actions (`useActions`): the first `inline` (4) as buttons, the rest behind ⋯, the destructive ones in the danger colour; an action with `actions` opens a menu. `iconOnly` lists ids drawn as an icon.",
      },
    ],
  },
];
