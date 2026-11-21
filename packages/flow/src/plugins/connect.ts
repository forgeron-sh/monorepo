// The connection rules of the bundled plugins, one plugin each. A rule is asked when an edge is
// made, moved or hovered, and answers `null` to accept or the reason it refuses: the reason codes
// are the ones the editor has always given (`same-node`, `type`, `duplicate`, `fan-out`,
// `occupied`, `cycle`), each with a sentence. With none of them, any output connects to any input.

import { ANY, reaches } from "../core/model";
import { definePlugin, type ConnectionRule } from "../core/plugin";

/** Equal types, or `any` on either side, or a type the input's declaration says it takes. */
const defaultCompatible = (from: string, to: string, accepts: ReadonlyArray<string> = []) =>
  from === to || from === ANY || to === ANY || accepts.includes(from);

export const selfLoopRule: ConnectionRule = {
  id: "same-node",
  check: ({ source, target }) => (source.id === target.id ? "same-node" : null),
  messages: { "same-node": "A node cannot feed itself." },
};

export const typeRule: ConnectionRule = {
  id: "type",
  check: ({ out, input, options, registry }) => {
    const a = out.type ?? ANY;
    const b = input.type ?? ANY;
    const ok = options.compatible
      ? options.compatible(a, b)
      : defaultCompatible(a, b, registry.portType(b)?.accepts);
    return ok ? null : "type";
  },
  matches: (out, input, options, registry) => {
    const a = out.type ?? ANY;
    const b = input.type ?? ANY;
    return options.compatible
      ? options.compatible(a, b)
      : defaultCompatible(a, b, registry.portType(b)?.accepts);
  },
  messages: { type: "These two ports carry different types of data." },
};

export const duplicateRule: ConnectionRule = {
  id: "duplicate",
  check: ({ leaving, to }) =>
    leaving.some((e) => e.to.node === to.node && e.to.port === to.port) ? "duplicate" : null,
  messages: { duplicate: "These two ports are already connected." },
};

export const fanOutRule: ConnectionRule = {
  id: "fan-out",
  check: ({ out, leaving }) => (out.multiple === false && leaving.length > 0 ? "fan-out" : null),
  messages: { "fan-out": "This output feeds one input only." },
};

export const occupiedRule: ConnectionRule = {
  id: "occupied",
  check: ({ input, entering }) => (!input.multiple && entering.length > 0 ? "occupied" : null),
  messages: { occupied: "This input already has an edge; only a merge input takes several." },
};

export const cycleRule: ConnectionRule = {
  id: "cycle",
  check: ({ index, source, target, options }) =>
    (options.cycles ?? "forbid") === "forbid" && reaches(index, target.id, source.id)
      ? "cycle"
      : null,
  messages: { cycle: "This edge would close a loop." },
};

export const selfLoop = definePlugin({
  id: "self-loop",
  name: "No self loop",
  description: "Refuses an edge from a node to itself.",
  connectionRules: [selfLoopRule],
});

export const portTypes = definePlugin({
  id: "port-types",
  name: "Port types",
  description:
    "An output feeds an input of the same type, or of `any`; a port type may declare others its inputs take. `ConnectOptions.compatible` replaces the test.",
  portTypes: {
    [ANY]: { label: "Any", description: "A port that says no type connects to anything." },
  },
  connectionRules: [typeRule],
});

export const noDuplicates = definePlugin({
  id: "no-duplicates",
  name: "No duplicate edge",
  description: "Refuses a second edge between the same two ports.",
  connectionRules: [duplicateRule],
});

export const fanOut = definePlugin({
  id: "fan-out",
  name: "Single fan-out",
  description:
    "An output feeds any number of inputs unless it says `multiple: false`, then it feeds one.",
  connectionRules: [fanOutRule],
});

export const singleInput = definePlugin({
  id: "single-input",
  name: "Single input",
  description: "An input takes one edge unless it says `multiple: true` (a merge).",
  connectionRules: [occupiedRule],
});

export const noCycles = definePlugin({
  id: "no-cycles",
  name: "No cycles",
  description: "Refuses an edge that closes a loop, unless `ConnectOptions.cycles` is `allow`.",
  connectionRules: [cycleRule],
});

/** All six, in the order the editor has always asked them. */
export const connectionPlugins = [
  selfLoop,
  portTypes,
  noDuplicates,
  fanOut,
  singleInput,
  noCycles,
] as const;
