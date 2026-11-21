import type { PixelIcon } from "../types";

// The Facebook mark in a rounded square: the letter f cut out of the square and running off its
// bottom edge.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "facebook-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "#######...##",
    "######..####",
    "######..####",
    "####......##",
    "######..####",
    "######..####",
    "######..####",
    "######..####",
    "######..####",
    ".#####..###",
  ],
};

export default icon;
