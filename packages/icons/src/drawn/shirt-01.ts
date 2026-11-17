import type { PixelIcon } from "../types";

// T-shirt: a collar, two short sleeves, the body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shirt-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    ".##..##..##",
    "#..........#",
    "###......###",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
