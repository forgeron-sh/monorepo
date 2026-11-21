// The parts of the outline: a title that folds the panel, and the list, in the order you choose.
import { Outline, OutlineContent, OutlineList, OutlineTitle } from "@forgeron/ui";

const headings = [
  { id: "olp-goals", text: "Goals", level: 1 },
  { id: "olp-scope", text: "Scope", level: 2 },
  { id: "olp-plan", text: "Plan", level: 1 },
  { id: "olp-q1", text: "First quarter", level: 2 },
  { id: "olp-risks", text: "Risks", level: 1 },
];

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 240 }}>
      <Outline headings={headings} foldable defaultActive="olp-scope">
        <OutlineTitle>Contents</OutlineTitle>
        <OutlineContent>
          <OutlineList />
        </OutlineContent>
      </Outline>
    </div>
  );
}
