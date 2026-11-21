// Blocks of the "marketing" group: the landing and marketing pages: hero, sections, pricing, FAQ, footer.
// Each block lives in its own file next to this one; this barrel re-exports them. Each is a root
// with parts: `Bento` and `BentoCell` (`BentoCellArt`…), `ArtCard`, `FigureGrid`, `CompareTable`,
// `CtaBand`, `Faq`, `SiteFooter`, `Hero`, `LogoStrip`, `SiteNav`, `PlanCard`, `StoryStep`.

export {
  Bento,
  BentoCell,
  BentoCellArt,
  BentoCellCopy,
  BentoCellCorner,
  BentoCellText,
  BentoCellTitle,
} from "./marketing-bento";
export type { BentoCellProps, BentoProps } from "./marketing-bento";
export {
  ArtCard,
  ArtCardArt,
  ArtCardCopy,
  ArtCardEyebrow,
  ArtCardText,
  ArtCardTitle,
  CardGrid,
  FigureGrid,
  FigureGridItem,
} from "./marketing-cards";
export type {
  ArtCardProps,
  CardGridProps,
  FigureGridItemProps,
  FigureGridProps,
} from "./marketing-cards";
export {
  CompareTable,
  CompareTableCell,
  CompareTableColumn,
  CompareTableGroup,
  CompareTableHead,
  CompareTableName,
  CompareTableRow,
} from "./marketing-compare";
export type { CompareTableProps, CompareValue } from "./marketing-compare";
export {
  CtaBand,
  CtaBandActions,
  CtaBandArt,
  CtaBandCell,
  CtaBandCopy,
  CtaBandInner,
} from "./marketing-cta";
export type { CtaBandProps } from "./marketing-cta";
export { Faq, FaqAnswer, FaqItem, FaqQuestion } from "./marketing-faq";
export type { FaqProps } from "./marketing-faq";
export {
  SiteFooter,
  SiteFooterBrand,
  SiteFooterCell,
  SiteFooterHearth,
  SiteFooterIndex,
  SiteFooterLegal,
  SiteFooterWord,
} from "./marketing-footer";
export type { SiteFooterColumn, SiteFooterProps } from "./marketing-footer";
export {
  Hero,
  HeroChip,
  HeroCta,
  HeroLead,
  HeroLeft,
  HeroProofRow,
  HeroRight,
  LogoStrip,
  LogoStripEmpty,
  LogoStripLead,
  LogoStripName,
} from "./marketing-hero";
export type { HeroProof, HeroProps, LogoStripProps } from "./marketing-hero";
export { SiteNav, SiteNavActions, SiteNavBar, SiteNavHome, SiteNavLinks } from "./marketing-nav";
export type { SiteNavLink, SiteNavProps } from "./marketing-nav";
export {
  PlanCard,
  PlanCardAction,
  PlanCardArt,
  PlanCardGroup,
  PlanCardHead,
  PlanCardList,
  PlanCardPrice,
  PlanCardTag,
  PlanCardWhere,
  PlanGrid,
} from "./marketing-plans";
export type { PlanCardProps, PlanGridProps } from "./marketing-plans";
export {
  StoryList,
  StoryStep,
  StoryStepArt,
  StoryStepCopy,
  StoryStepNumber,
  StoryStepPoints,
  StoryStepText,
  StoryStepTitle,
} from "./marketing-steps";
export type { StoryListProps, StoryStepProps } from "./marketing-steps";
