import { Rating, RatingItem } from "@forgeron/ui";

// One RatingItem per star; a function child draws its own glyph from how lit it is.
export default function Composed() {
  return (
    <Rating label="Mood" max={5} defaultValue={3}>
      {[0, 1, 2, 3, 4].map((i) => (
        <RatingItem key={i} index={i}>
          {(fill: number) => <span style={{ opacity: fill ? 1 : 0.3, fontSize: 20 }}>{i + 1}</span>}
        </RatingItem>
      ))}
    </Rating>
  );
}
