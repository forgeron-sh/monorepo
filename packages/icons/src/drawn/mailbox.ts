import type { PixelIcon } from "../types";

// Mailbox.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mailbox",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........oo",
    "..######.oo",
    ".#......#o",
    ".#......#o",
    ".#......#o",
    ".########",
    "....##",
    "....##",
    "....##",
    "..######",
  ],
};

export default icon;
