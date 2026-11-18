import type { PixelIcon } from "../types";

// Blinds: window blinds: a head rail, three slats and the pull cord.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "blinds",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "",
    ".##########",
    "",
    ".##########",
    "",
    ".##########",
    ".........o",
    ".........o",
    "........ooo",
  ],
};

export default icon;
