import type { PixelIcon } from "../types";

// The npm mark in pixels: a square with the letter n cut out of it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "npm",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "############",
    "############",
    "##........##",
    "##........##",
    "##....##..##",
    "##....##..##",
    "##....##..##",
    "##....##..##",
    "##....##..##",
    "##....##..##",
    "############",
    "############",
  ],
};

export default icon;
