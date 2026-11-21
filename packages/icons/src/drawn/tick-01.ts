import type { PixelIcon } from "../types";

// Check mark, 12×12: the short arm in the secondary tone, the long arm in the primary.
const icon: PixelIcon = {
  name: "tick-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..........##",
    ".........##",
    "........##",
    ".oo....##",
    "..oo..##",
    "...oo##",
    "....##",
  ],
};

export default icon;
