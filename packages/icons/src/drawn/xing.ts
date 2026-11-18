import type { PixelIcon } from "../types";

// The XING mark: a small chevron beside a tall stroke that bends at its middle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "xing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........##",
    "........##",
    "........##",
    ".##....##",
    "..##...##",
    "...##.##",
    "..##..##",
    ".##....##",
    ".......##",
    "........##",
    "........##",
    ".........##",
  ],
};

export default icon;
