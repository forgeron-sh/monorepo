import type { PixelIcon } from "../types";

// The Visual Studio Code mark: a tall bar on the right and two crossed arms reaching left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "visual-studio-code",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........###",
    "#.....##.##",
    "##...##..##",
    ".##.##...##",
    "..###....##",
    ".##.##...##",
    "##...##..##",
    "#.....##.##",
    "........###",
    ".........##",
  ],
};

export default icon;
