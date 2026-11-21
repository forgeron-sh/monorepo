// The bar that takes the place of the filters while items are selected: how many, a way out, and
// the actions on them. The actions are the screen's (`useActions`): the first ones as buttons,
// the rest behind ⋯, the destructive one last. The parts are the primitive's (selection-bar.tsx);
// this is the form built from `actions`.

import type { ComponentProps, ReactNode } from "react";
import type { Action } from "../hooks/use-actions";
import {
  SelectionBar as Bar,
  SelectionBarActions,
  SelectionBarClear,
  SelectionBarCount,
  SelectionBarSeparator,
} from "../selection-bar";

export interface SelectionBarProps extends Omit<
  ComponentProps<"div">,
  "children" | "className" | "onClear" | "ref"
> {
  /** How many items are selected; the bar is drawn for one or more. */
  count: number;
  /** The way out: the × and Escape. */
  onClear: () => void;
  /** The actions on the selection, the same list as the menus' (`useActions`). */
  actions: ReadonlyArray<Action>;
  /** Called after an action's own `run`, with its id. */
  onAction?: (id: string) => void;
  /** How many actions show as buttons before the ⋯; 4 by default. Destructive ones count too. */
  inline?: number;
  /** The ids of the actions shown as an icon alone (their label becomes the tooltip). */
  iconOnly?: ReadonlyArray<string>;
  /** Written in place of "3 selected". */
  children?: ReactNode;
  className?: string;
}

/** "3 selected", the × that clears, the actions as buttons and the rest behind ⋯. */
export function SelectionBar({
  count,
  onClear,
  actions,
  onAction,
  inline,
  iconOnly,
  children,
  className,
  ...rest
}: SelectionBarProps) {
  return (
    <Bar count={count} onClear={onClear} {...rest} {...(className ? { className } : {})}>
      <SelectionBarClear />
      <SelectionBarCount>{children}</SelectionBarCount>
      <SelectionBarSeparator />
      <SelectionBarActions
        actions={actions}
        {...(onAction ? { onAction } : {})}
        {...(inline !== undefined ? { inline } : {})}
        {...(iconOnly ? { iconOnly } : {})}
      />
    </Bar>
  );
}
