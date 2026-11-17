import type { PixelIcon } from "../types";

// Hamburger: a domed bun, a patty in the secondary tone and a bottom bun.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hamburger-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".##########",
    "",
    ".oooooooooo",
    ".oooooooooo",
    "",
    ".##########",
    "..########",
  ],
};

export default icon;
