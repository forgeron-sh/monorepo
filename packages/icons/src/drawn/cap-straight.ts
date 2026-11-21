import type { PixelIcon } from "../types";

// Square line cap: the end of a thick stroke cut square, its centre line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cap-straight",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "###########",
    "..........#",
    "..........#",
    "oooooo....#",
    "oooooo....#",
    "..........#",
    "..........#",
    "###########",
  ],
};

export default icon;
