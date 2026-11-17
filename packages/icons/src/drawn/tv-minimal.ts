import type { PixelIcon } from "../types";

// Minimal TV: the screen of `tv-01` without antenna, a short base line under it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tv-minimal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    "",
    "...######",
  ],
};

export default icon;
