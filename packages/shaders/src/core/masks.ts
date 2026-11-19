import type { BayerSize } from "./bayer";
import { bindChain, type Preset } from "./contract";
import { runCpu, type SvgPathOptions, toSvgPath } from "./cpu";
import { orderedCpu } from "./passes/ordered.cpu";
import { preset } from "./presets";
import { constantCpu } from "./sources/constant.cpu";

/**
 * A level through the ordered dither, the mask of a corruption: the cells of an `n × n` Bayer
 * tile whose threshold is under `level / n²` are drawn (tone 1). The captions of forgeron.sh's
 * opening switch their pixels on level by level through it; the burn's fringe paints the others.
 */
export const bayerMaskPreset = (level: number, n: BayerSize = 4): Preset =>
  preset(`bayer-mask-${n}-${level}`, { type: "constant", value: level / (n * n) }, [
    { type: "ordered", matrix: n, centered: true, origin: "top", steps: [[0, 1]] },
  ]);

/**
 * The SVG path of a Bayer mask (`bayerMaskPreset`), cells of `cell` units, row by row: the cells
 * on at `level`, or the others with `off`. Static: the site writes its masks at build time.
 */
export function bayerMaskPath(
  level: number,
  options: { n?: BayerSize; off?: boolean; cell?: number } = {},
): string {
  const n = options.n ?? 4;
  const chain = bindChain(
    bayerMaskPreset(level, n),
    { constant: constantCpu },
    { ordered: orderedCpu },
  );
  const svg: SvgPathOptions = { cell: options.cell ?? 1, ...(options.off ? { max: 0 } : {}) };
  return toSvgPath(runCpu(chain, n, n, { px: 1 }), options.off ? 0 : 1, svg);
}
