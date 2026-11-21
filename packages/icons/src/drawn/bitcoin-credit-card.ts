import type { PixelIcon } from "../types";

// The card of `credit-card`, its band in the primary tone, and a bitcoin sign badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-credit-card",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#",
    ".#.....oooo",
    ".#.....o...o",
    ".#####.oooo",
    ".......o...o",
    ".......oooo",
  ],
};

export default icon;
