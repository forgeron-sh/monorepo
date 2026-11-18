// Blocks of the "marketing" group: the landing and marketing pages: hero, sections, pricing, FAQ, footer.
// Each block lives in its own file next to this one; this barrel re-exports them.

export { Bento, BentoCell } from "./marketing-bento";
export type { BentoCellProps, BentoProps } from "./marketing-bento";
export { ArtCard, CardGrid, FigureGrid } from "./marketing-cards";
export type { ArtCardProps, CardGridProps, FigureGridProps } from "./marketing-cards";
export { CompareTable } from "./marketing-compare";
export type { CompareTableProps, CompareValue } from "./marketing-compare";
export { CtaBand } from "./marketing-cta";
export type { CtaBandProps } from "./marketing-cta";
export { Faq } from "./marketing-faq";
export type { FaqProps } from "./marketing-faq";
export { SiteFooter } from "./marketing-footer";
export type { SiteFooterColumn, SiteFooterProps } from "./marketing-footer";
export { Hero, LogoStrip } from "./marketing-hero";
export type { HeroProof, HeroProps, LogoStripProps } from "./marketing-hero";
export { SiteNav } from "./marketing-nav";
export type { SiteNavLink, SiteNavProps } from "./marketing-nav";
export { PlanCard, PlanGrid } from "./marketing-plans";
export type { PlanCardProps, PlanGridProps } from "./marketing-plans";
export { StoryList, StoryStep } from "./marketing-steps";
export type { StoryListProps, StoryStepProps } from "./marketing-steps";
