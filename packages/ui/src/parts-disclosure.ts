// shadcn parts of the "disclosure" group (D-156): re-exports only the new names; the roots stay exported where they were.
export {
  AccordionContent,
  AccordionTrigger,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
export type {
  AccordionContentProps,
  AccordionItemProps,
  AccordionRootProps,
  AccordionTriggerProps,
  CollapsibleContentProps,
  CollapsibleRootProps,
  CollapsibleTriggerProps,
} from "./collapsible";
export {
  BreadcrumbEllipsis,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./identity";
export type { BreadcrumbLinkProps, BreadcrumbRootProps } from "./identity";
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
export type { PaginationLinkProps } from "./pagination";
export { ScrollArea, ScrollBar } from "./scroll-area";
export type { ScrollAreaProps, ScrollBarProps } from "./scroll-area";
export { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
export type { HoverCardContentProps, HoverCardProps, HoverCardTriggerProps } from "./hover-card";
export { TabsContent, TabsList, TabsTrigger } from "./tabs";
export type { TabsRootProps } from "./tabs";
