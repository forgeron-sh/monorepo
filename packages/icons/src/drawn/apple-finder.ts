import type { PixelIcon } from "../types";

// The Finder face in pixels: a rounded square split by a profile, the left half dark and the right half in the secondary tone, with two eyes and a smile.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
// Finder and the Finder logo are trademarks of Apple Inc., used here only to refer to Finder.
const icon: PixelIcon = {
  name: "apple-finder",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".#####ooooo",
    "######oooooo",
    "######oooooo",
    "###.##oo.ooo",
    "###.##oo.ooo",
    "#####ooooooo",
    "#####ooooooo",
    "######oooooo",
    "##.###ooo.oo",
    "###......ooo",
    "######oooooo",
    ".#####ooooo",
  ],
};

export default icon;
