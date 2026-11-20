// shadcn parts of the "overlays" group (D-156): re-exports only the new names; the roots stay exported where they were.
export {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
export type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerRootProps,
  DrawerTriggerProps,
} from "./drawer";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
export type { SheetCloseProps, SheetContentProps, SheetTriggerProps } from "./sheet";
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
export type { AlertDialogButtonProps, AlertDialogTriggerProps } from "./alert-dialog";
