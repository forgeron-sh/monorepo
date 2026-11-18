import type { PixelIcon } from "../types";

// The xAI mark used by Grok: a long diagonal from the top left, a short slash from the bottom left
// and a tall bar on the right.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "grok-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "##.......##",
    ".##......##",
    ".##......##",
    "..##.....##",
    "...##....##",
    "...##....##",
    "....##...##",
    ".....##..##",
    "...#.##..##",
    "..#...##.##",
    ".#....##.##",
    "#........##",
  ],
};

export default icon;
