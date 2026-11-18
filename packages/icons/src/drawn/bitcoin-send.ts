import type { PixelIcon } from "../types";

// The bitcoin sign of `bitcoin-01`, moved left, with the arrow badge of `pound-send` pointing out, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-send",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##",
    ".####",
    ".##.##",
    ".#####",
    ".##..##",
    ".##..##",
    ".#####...o",
    "...##.....o",
    ".......ooooo",
    "..........o",
    ".........o",
  ],
};

export default icon;
