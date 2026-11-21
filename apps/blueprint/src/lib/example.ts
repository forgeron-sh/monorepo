import type { BlueprintFile } from "@forgeron/blueprint/format";

/**
 * The home page's file: a part, an assembly that stacks it, and a scene that blinks a light and
 * turns a gear. The page prints it and draws it at build time; a test reads it with the reference
 * reader, so it stays a valid file.
 */
export const EXAMPLE: BlueprintFile = {
  $schema: "https://blueprint.forgeron.sh/schema/v1.json",
  version: 1,
  id: "examples/rack",
  parts: {
    server: {
      params: { light: { type: "flag", default: false } },
      prims: [
        { kind: "box", at: [0, 0, 0], size: [5, 4, 1.6], vents: "+x" },
        {
          kind: "dot",
          layer: 1,
          at: [5, 3, 0.8],
          size: 1,
          ink: { if: "@light", then: "accent", else: "dim" },
        },
      ],
    },
    gear: {
      params: { angle: { type: "number", default: 0 } },
      prims: [
        {
          kind: "rig",
          rig: "wheel",
          with: { c: [0, 0, 0], r: 1.6, plane: "yz", teeth: 11, spokes: 3, angle: "@angle" },
        },
      ],
    },
  },
  assemblies: {
    rack: {
      instances: [
        { id: "a", use: "server" },
        { id: "b", use: "server", at: [0, 0, 1.6], params: { light: true } },
        { id: "c", use: "server", at: [0, 0, 3.2] },
        { id: "g", use: "gear", at: [2.5, 2, 6.6] },
      ],
    },
  },
  scenes: {
    rack: {
      title: "A rack of three servers and a gear",
      depth: "painter",
      camera: { view: 0, fit: { fill: 0.8, unit: "any" } },
      root: { instances: [{ id: "rack", use: "rack" }] },
      timelines: {
        idle: {
          tracks: [
            { kind: "spin", target: "rack/g", channel: "param:angle", rate: 1.4 },
            {
              kind: "blink",
              target: "rack/a",
              channel: "param:light",
              rate: 2,
              period: 5,
              on: 2,
              seed: 0,
            },
          ],
        },
      },
    },
  },
};
