import { SectionBand } from "@forgeron/ui";
import {
  ClosingCta,
  ClosingFaq,
  HeroBlock,
  NavigationBottom,
  NavigationTop,
  PricingBlock,
  ShowcaseBento,
  ShowcaseCards,
  ShowcaseFigures,
  StoryBlock,
} from "./parts";

// A whole landing page from the six marketing blocks of @forgeron/ui, top to bottom, as on
// forgeron.sh. Each block is also shown alone on its own Marketing page (see parts.tsx).

export default function Landing() {
  return (
    <div className="landing">
      <NavigationTop />

      <main>
        <HeroBlock />
        <StoryBlock />
        <SectionBand className="fg-rail" from="/0.1" to="/0.2" label="Access" />
        <ShowcaseCards />
        <SectionBand className="fg-rail" from="/0.2" to="/0.3" label="The network" />
        <ShowcaseFigures />
        <SectionBand className="fg-rail" from="/0.3" to="/0.4" label="Hosting" />
        <PricingBlock />
        <SectionBand className="fg-rail" from="/0.4" to="/0.5" label="Extras" />
        <ShowcaseBento />
        <SectionBand className="fg-rail" from="/0.5" to="/0.6" label="Questions" />
        <ClosingFaq />
        <ClosingCta />
      </main>

      <NavigationBottom />
    </div>
  );
}
