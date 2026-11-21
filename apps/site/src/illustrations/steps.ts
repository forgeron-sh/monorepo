/**
 * The village's story steps (`village.ts`), as ranges of progress; the home page's captions use
 * the same ones. On their own so that the page reads them without the scene's code, which runs
 * in the worker.
 */
export const STEPS = {
  intro: [0, 0.05],
  complex: [0.05, 0.105],
  unfit: [0.105, 0.16],
  excel: [0.16, 0.215],
  tinker: [0.215, 0.27],
  upgrade: [0.27, 0.33],
  generic: [0.33, 0.39],
  plug: [0.39, 0.45],
  ai: [0.45, 0.51],
  lockin: [0.51, 0.6],
  support: [0.6, 0.69],
  boom: [0.69, 0.8],
  fire: [0.8, 0.9],
  out: [0.9, 1],
} as const;
