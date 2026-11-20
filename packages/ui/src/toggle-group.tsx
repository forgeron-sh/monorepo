import { createContext, useContext, type ComponentProps } from "react";
import { ToggleGroup as Base } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cx } from "./cx";
import { toggleClass, type ToggleStyleProps } from "./toggle";

const Style = createContext<ToggleStyleProps>({});

export type ToggleGroupProps = Omit<ComponentProps<typeof Base>, "className"> &
  ToggleStyleProps & {
    className?: string;
    /** shadcn's older spelling: `multiple` lets several be pressed, `single` (default) one. */
    type?: "single" | "multiple";
  };

/** A row of toggles (shadcn's ToggleGroup on Base UI): `value` is a list of pressed `value`s. */
export function ToggleGroup({ variant, size, type, className, ...rest }: ToggleGroupProps) {
  return (
    <Style.Provider value={{ variant, size }}>
      <Base
        {...(type === "multiple" ? { multiple: true } : {})}
        {...rest}
        data-variant={variant ?? "default"}
        className={cx("fg-toggle-group", className)}
      />
    </Style.Provider>
  );
}

export type ToggleGroupItemProps = Omit<ComponentProps<typeof BaseToggle>, "className"> &
  ToggleStyleProps & { className?: string };

/** One toggle of the group; it takes `variant` and `size` from the group unless it sets its own. */
export function ToggleGroupItem({ variant, size, className, ...rest }: ToggleGroupItemProps) {
  const group = useContext(Style);
  return (
    <BaseToggle
      {...rest}
      className={cx(
        toggleClass({ variant: variant ?? group.variant, size: size ?? group.size }),
        className,
      )}
    />
  );
}
