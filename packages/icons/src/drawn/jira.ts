import type { PixelIcon } from "../types";

// The Jira mark, 16×16: three chevrons stacked from the top right to the bottom left, each a
// three-pixel bar with a three-pixel leg, separated by one-pixel gaps. Rasterised from
// `simple-icons:jira` (Iconify, 2026-11-17), then redrawn with square chevrons: the slanted inner
// cuts of the reference are below a pixel at this size. Monotone.
const icon: PixelIcon = {
  name: "jira",
  implemented: true,
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "........########",
    "........########",
    "........########",
    ".............###",
    "....########.###",
    "....########.###",
    "....########.###",
    ".........###.###",
    "########.###",
    "########.###",
    "########.###",
    ".....###.###",
    ".....###",
    ".....###",
    ".....###",
    ".....###",
  ],
};

export default icon;
