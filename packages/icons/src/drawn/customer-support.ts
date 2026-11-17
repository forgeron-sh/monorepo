import type { PixelIcon } from "../types";

// Drawn for the home page's catalog, 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "customer-support",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    "###......###",
    "#o#......#o#",
    "#o#......#o#",
    "###......###",
    "..........#",
    ".........#",
    "......###",
  ],
};

export default icon;
