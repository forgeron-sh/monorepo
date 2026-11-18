import { ArtCard, CardGrid } from "@forgeron/ui";

// A word in ember above the title, as the rules of a pricing page.
export default function Eyebrow() {
  return (
    <CardGrid as="ul" artHeight={120}>
      <ArtCard
        as="li"
        eyebrow="Each month"
        title="Included"
        text="Your plan tops up your balance."
      />
      <ArtCard
        as="li"
        eyebrow="On top"
        title="Top-ups last a year"
        text="Used after the month's own."
      />
      <ArtCard as="li" eyebrow="Fuel" title="One balance" text="AI and compute draw on it." />
    </CardGrid>
  );
}
