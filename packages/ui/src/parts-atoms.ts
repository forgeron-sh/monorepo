// shadcn parts of the atoms with an inner structure (D-156): Page, Notice, EmptyState. The roots stay
// exported where they were.
export { PageActions, PageBody, PageDescription, PageHeader, PageTitle, PageTitles } from "./page";
export type { PagePartsProps } from "./page";
export {
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  NoticeAction,
  NoticeDescription,
  NoticeTitle,
} from "./feedback";
export type { EmptyStateIconProps, EmptyStatePartsProps } from "./feedback";
