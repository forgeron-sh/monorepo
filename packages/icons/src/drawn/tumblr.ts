import type { PixelIcon } from "../types";

// The Tumblr mark: a solid lowercase t with a crossbar and a tail that turns up.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tumblr",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....###",
    "..#######",
    "..#######",
    "....###",
    "....###",
    "....###",
    "....###..#",
    ".....#####",
    "......###",
  ],
};

export default icon;
