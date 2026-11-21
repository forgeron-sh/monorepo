import { Rating } from "@forgeron/ui";
import { useState } from "react";

export default function Stars() {
  const [stars, setStars] = useState<number | null>(3);
  return <Rating label="Quality" value={stars} onChange={setStars} />;
}
