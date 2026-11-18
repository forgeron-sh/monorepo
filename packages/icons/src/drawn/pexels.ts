import type { PixelIcon } from "../types";

// The Pexels mark in pixels: a rounded square with the letter P cut out of it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pexels",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "###.....####",
    "###.###..###",
    "###.####.###",
    "###.###..###",
    "###.....####",
    "###.########",
    "###.########",
    "###.########",
    "############",
    ".##########",
  ],
};

export default icon;
