import type { PixelIcon } from "../types";

// The Kickstarter K cut out of a rounded square, as on the app icon.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "kickstarter-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "##..####..##",
    "##..###..###",
    "##..##..####",
    "##.....#####",
    "##.....#####",
    "##..##..####",
    "##..###..###",
    "##..####..##",
    "############",
    ".##########",
  ],
};

export default icon;
