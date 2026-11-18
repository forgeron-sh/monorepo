import type { PixelIcon } from "../types";

// Vertical gallery: a card between the edges of its two neighbours, above and below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gallery-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    "",
    ".##########",
  ],
};

export default icon;
