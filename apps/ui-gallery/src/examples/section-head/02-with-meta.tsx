import { SectionHead } from "@forgeron/ui";

// A note on the right of the coordinate, and no lead.
export default function WithMeta() {
  return (
    <div className="fg-rail">
      <SectionHead index="/0.8" title={["Questions,", "answered."]} meta="6 questions" />
    </div>
  );
}
