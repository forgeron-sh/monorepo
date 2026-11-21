import type { PixelIcon } from "../types";

// Squat: a person with the head in the secondary tone, arms forward, thighs level, shins down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "workout-squats",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oo",
    "...oo",
    "",
    "...##",
    "...#######",
    "...##",
    "...######",
    "........#",
    "........#",
    "........##",
  ],
};

export default icon;
