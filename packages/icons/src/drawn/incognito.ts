import type { PixelIcon } from "../types";

// Incognito: a solid hat over two round dark lenses.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "incognito",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "...######",
    "..########",
    ".##########",
    "",
    "..##....##",
    ".##########",
    ".####..####",
    "..##....##",
  ],
};

export default icon;
