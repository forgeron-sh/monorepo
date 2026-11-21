// Open or closed: a menu, a popover, a dialog, a drawer, a palette. The caller may own the state
// (`open` + `onOpenChange`), e.g. to open a menu from a shortcut, or leave it to the component.

import { useControllableState } from "./use-controllable";

export interface DisclosureOptions {
  open?: boolean | undefined;
  defaultOpen?: boolean;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface Disclosure {
  open: boolean;
  setOpen: (open: boolean) => void;
  onOpen: () => void;
  onClose: () => void;
  toggle: () => void;
  /** Spread on a Base UI root, a `Dialog`, a `CommandPalette`: `{ open, onOpenChange }`. */
  props: { open: boolean; onOpenChange: (open: boolean) => void };
}

/** The state of something that opens: `const palette = useDisclosure(); <CommandPalette {...palette.props} />`. */
export function useDisclosure({
  open,
  defaultOpen = false,
  onOpenChange,
}: DisclosureOptions = {}): Disclosure {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return {
    open: isOpen,
    setOpen,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    toggle: () => setOpen((o) => !o),
    props: { open: isOpen, onOpenChange: setOpen },
  };
}
