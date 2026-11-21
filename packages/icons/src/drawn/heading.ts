import type { PixelIcon } from "../types";

// Heading: a two-pixel H with a two-row crossbar, centred both ways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "heading",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..########",
    "..########",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
