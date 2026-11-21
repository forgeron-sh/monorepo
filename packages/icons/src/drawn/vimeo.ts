import type { PixelIcon } from "../types";

// The Vimeo mark: a solid v with a hooked left arm and a right arm that rises to a round tip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "vimeo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##......##",
    "###.....####",
    "..##....###",
    "..##...###",
    "...##..##",
    "...##.##",
    "....####",
    "....###",
    ".....#",
  ],
};

export default icon;
