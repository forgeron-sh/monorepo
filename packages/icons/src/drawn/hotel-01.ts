import type { PixelIcon } from "../types";

// Hotel bed: headboard, pillow in the secondary tone, mattress and footboard.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hotel-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#",
    ".#",
    ".#.oo",
    ".#.oo",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
  ],
};

export default icon;
