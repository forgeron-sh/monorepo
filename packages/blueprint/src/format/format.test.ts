import { describe, expect, it } from "vitest";
import schemaFile from "../../schema/blueprint.v1.json";
import type { Block } from "../core/types";
import { render } from "../core/render";
import { cube, stack } from "../examples/scenes";
import { convertScene, normalizeBlock, type Sample, staticBlocks } from "./convert";
import rackRoom from "./examples/rack-room.bp";
import { flatten } from "./flatten";
import { readBlueprint } from "./read";
import { SCHEMA } from "./schema";
import type { BlueprintFile } from "./types";
import { validate } from "./validate";
import { writeBlueprint } from "./write";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const HEAD = { $schema: "https://blueprint.forgeron.sh/schema/v1.json", version: 1 } as const;

describe("schema", () => {
  it("is written from its source (run scripts/blueprint/gen-schema.ts)", () => {
    expect(schemaFile).toStrictEqual(SCHEMA);
  });

  it("accepts the example of the design (§2)", () => {
    expect(() => validate(rackRoom)).not.toThrow();
  });

  // Each case breaks the example in one place; the message must name that place.
  const broken: [string, (f: any) => void, string][] = [
    ["wrong $schema", (f) => (f.$schema = "https://example.com"), "/$schema"],
    ["missing id", (f) => delete f.id, `/: missing "id"`],
    ["box without size", (f) => delete f.parts.rack.prims[0].size, "/parts/rack/prims/0"],
    ["a Vec3 of two numbers", (f) => (f.parts.rack.prims[0].at = [0, 0]), "/parts/rack/prims/0/at"],
    ["a string coordinate", (f) => (f.parts.rack.prims[0].at[1] = "1"), "/parts/rack/prims/0/at/1"],
    [
      "unknown prim kind",
      (f) => (f.parts.packet.prims[0].kind = "circle"),
      "/parts/packet/prims/0/kind",
    ],
    ["unknown ink", (f) => (f.parts.rack.prims[1].ink.then = "blue"), "/parts/rack/prims/1/ink"],
    ["unknown property", (f) => (f.parts.rack.prims[0].colour = 1), "/parts/rack/prims/0/colour"],
    [
      "turn of 5",
      (f) => (f.scenes["rack-room"].root.instances[1].turn = 5),
      "/scenes/rack-room/root/instances/1/turn",
    ],
    [
      "depth missing",
      (f) => delete f.scenes["rack-room"].depth,
      `/scenes/rack-room: missing "depth"`,
    ],
    [
      "unknown var type",
      (f) => (f.scenes["rack-room"].vars.active.type = "float"),
      "/scenes/rack-room/vars/active/type",
    ],
    ["a name with a colon", (f) => (f.parts["a:b"] = { prims: [] }), "/parts/a:b"],
    [
      "a bad param reference",
      (f) => (f.parts.gear.prims[0].with.angle = "@"),
      "/parts/gear/prims/0/with/angle",
    ],
    [
      "unknown track kind",
      (f) => (f.scenes["rack-room"].timelines.idle.tracks[0].kind = "wobble"),
      "/scenes/rack-room/timelines/idle/tracks/0/kind",
    ],
    [
      "a line of one point",
      (f) => (f.parts.packet.prims[0] = { kind: "line", points: [[0, 0, 0]] }),
      "/parts/packet/prims/0/points",
    ],
    [
      "duplicate instance id",
      (f) => (f.scenes["rack-room"].root.instances[1].id = "a"),
      "/scenes/rack-room/root/instances/1/id",
    ],
    [
      "snap to an unknown instance",
      (f) => (f.scenes["rack-room"].root.instances[2].snap.to = "z.top"),
      "/scenes/rack-room/root/instances/2/snap/to",
    ],
    [
      "a negative scale",
      (f) => (f.scenes["rack-room"].root.instances[0].scale = -1),
      "/scenes/rack-room/root/instances/0/scale",
    ],
  ];

  it.each(broken)("rejects %s, naming the path", (_, breakIt, path) => {
    const file = clone(rackRoom);
    breakIt(file);
    expect(() => validate(file, "case.bp")).toThrow(path);
  });

  it("refuses a newer version, naming it", () => {
    expect(() => validate({ ...clone(rackRoom), version: 2 })).toThrow(/version 2/);
  });
});

describe("imports", () => {
  const files: Record<string, object> = {
    "lib/screws.bp": {
      ...HEAD,
      id: "lib/screws",
      parts: { screw: { prims: [{ kind: "dot", at: [0, 0, 0] }] }, nut: { prims: [] } },
    },
    "lib/office.bp": {
      ...HEAD,
      id: "lib/office",
      imports: [{ from: "./screws.bp", as: "hw" }],
      parts: { desk: { prims: [{ kind: "box", at: [0, 0, 0], size: [2, 1, 1] }] } },
      assemblies: { corner: { instances: [{ use: "desk" }, { use: "hw:screw", at: [1, 0, 1] }] } },
    },
  };
  const load = (location: string) => {
    const file = files[location];
    if (!file) throw new Error("no such file");
    return file;
  };
  const root = (imports: object[], uses: string[] = []): BlueprintFile =>
    ({
      ...HEAD,
      id: "root",
      imports,
      scenes: {
        s: {
          title: "s",
          depth: "painter",
          camera: { view: 0, fit: {} },
          root: { instances: uses.map((use) => ({ use })) },
        },
      },
    }) as BlueprintFile;

  it("gives imported names their prefix, through nested imports", async () => {
    const lib = await readBlueprint(
      root([{ from: "./lib/office.bp", as: "office" }], ["office:corner", "office:hw:nut"]),
      { location: "root.bp", load },
    );
    expect([...lib.parts.keys()].sort()).toEqual([
      "office:desk",
      "office:hw:nut",
      "office:hw:screw",
    ]);
    expect(lib.assemblies.get("office:corner")?.instances.map((i) => i.use)).toEqual([
      "office:desk",
      "office:hw:screw",
    ]);
    expect(flatten(lib, "s")).toStrictEqual([
      { kind: "box", at: [0, 0, 0], size: [2, 1, 1] },
      { kind: "dot", at: [1, 0, 1] },
    ]);
  });

  it("takes only the names in `use`", async () => {
    const read = readBlueprint(
      root([{ from: "./lib/office.bp", as: "office", use: ["desk"] }], ["office:corner"]),
      { location: "root.bp", load },
    );
    await expect(read).rejects.toThrow(
      `/scenes/s/root/instances/0/use: "office:corner" is not defined or not imported`,
    );
  });

  it("names a missing name", async () => {
    const read = readBlueprint(root([{ from: "./lib/screws.bp", as: "hw", use: ["bolt"] }]), {
      location: "root.bp",
      load,
    });
    await expect(read).rejects.toThrow(`/imports/0/use/0: "bolt" is not defined in lib/screws.bp`);
  });

  it("refuses a prefix used twice", async () => {
    const read = readBlueprint(
      root([
        { from: "./lib/screws.bp", as: "hw" },
        { from: "./lib/office.bp", as: "hw" },
      ]),
      { location: "root.bp", load },
    );
    await expect(read).rejects.toThrow(
      `/imports/1/as: the prefix "hw" is already used by /imports/0`,
    );
  });

  it("refuses a cycle, naming it", async () => {
    const cyclic: Record<string, object> = {
      "a.bp": { ...HEAD, id: "a", imports: [{ from: "./b.bp", as: "b" }] },
      "b.bp": { ...HEAD, id: "b", imports: [{ from: "./a.bp", as: "a" }] },
    };
    const read = readBlueprint(cyclic["a.bp"], {
      location: "a.bp",
      load: (l) => cyclic[l],
    });
    await expect(read).rejects.toThrow("import cycle: a.bp → b.bp → a.bp");
  });

  it("validates imported files, naming them", async () => {
    const read = readBlueprint(root([{ from: "./bad.bp", as: "x" }]), {
      location: "root.bp",
      load: () => ({ ...HEAD, id: "bad", parts: { p: { prims: [{ kind: "dot" }] } } }),
    });
    await expect(read).rejects.toThrow(`bad.bp: /parts/p/prims/0: missing "at"`);
  });
});

describe("round trip", () => {
  it("reads back what it writes, bit for bit", async () => {
    const file = clone(rackRoom) as unknown as BlueprintFile;
    file.parts!.rack!.prims.push({ kind: "dot", at: [0.1 + 0.2, 1 / 3, -1.4 - 1e-15], size: 2 });
    const lib = await readBlueprint(writeBlueprint(file));
    expect(lib.file).toStrictEqual(file);
  });
});

describe("flatten", () => {
  const file = {
    ...HEAD,
    id: "test/flatten",
    parts: {
      post: {
        params: { on: { type: "flag", default: false }, h: { type: "number", default: 4 } },
        prims: [
          {
            kind: "box",
            at: [0, 0, 0],
            size: [2, 1, "@h"],
            anchor: "base-centre",
            tone: [0.1, 0.2, 0.3],
            look: { if: "@on", then: "accent", else: "plain" },
            vents: "+x",
            layer: 1,
          },
          {
            kind: "line",
            points: [
              [0, 0, 0],
              [0, 0, { p: "h", k: 2, b: 1 }],
              [1, 0, 9],
            ],
            ink: "dim",
          },
          { kind: "dot", at: [1, 0, 0], visible: "@on" },
          { kind: "label", at: [0, 0, 5], text: "POST", to: [0, 0, 4], active: { not: "@on" } },
        ],
        sockets: { top: { at: [0, 0, "@h"] } },
      },
      cap: {
        prims: [{ kind: "dot", at: [0, 0, 0], size: 3 }],
        sockets: { foot: { at: [0, 0, -1] } },
      },
    },
    scenes: {
      yard: {
        title: "Yard",
        depth: "painter",
        camera: { view: 0, fit: {} },
        vars: { active: { type: "int", default: -1 } },
        root: {
          params: { lit: { type: "flag", default: true } },
          instances: [
            { id: "a", use: "post", params: { on: "@lit" } },
            { id: "b", use: "post", at: [10, 0, 0], turn: 3, scale: 2, layer: 3 },
            { id: "c", use: "cap", snap: { socket: "foot", to: "b.top" } },
          ],
        },
      },
    },
  };

  it("places parts by turn, scale, params and snaps", async () => {
    const lib = await readBlueprint(file);
    const blocks = flatten(lib, "yard");
    expect(blocks).toStrictEqual([
      {
        kind: "box",
        at: [-1, -0.5, 0],
        size: [2, 1, 4],
        tone: [0.1, 0.2, 0.3],
        accent: true,
        vents: true,
        layer: 1,
      },
      { kind: "line", a: [0, 0, 0], b: [0, 0, 9], ink: "dim" },
      { kind: "line", a: [0, 0, 9], b: [1, 0, 9], ink: "dim" },
      { kind: "dot", at: [1, 0, 0] },
      { kind: "label", at: [0, 0, 5], text: "POST", to: [0, 0, 4] },
      // b: scale 2 then three quarter turns: x → -y, y → x; the +x vents face -y, hidden.
      { kind: "box", at: [9, -2, 0], size: [2, 4, 8], tone: [0.1, 0.3, 0.2], layer: 4 },
      { kind: "line", a: [10, 0, 0], b: [10, 0, 18], ink: "dim", layer: 3 },
      { kind: "line", a: [10, 0, 18], b: [10, -2, 18], ink: "dim", layer: 3 },
      { kind: "label", at: [10, 0, 10], text: "POST", to: [10, 0, 8], active: true, layer: 3 },
      // c: its foot (0, 0, -1) on b's top (10, 0, 8).
      { kind: "dot", at: [10, 0, 9], size: 3 },
    ]);
  });

  it("takes var and param values", async () => {
    const lib = await readBlueprint(file);
    expect(flatten(lib, "yard", { lit: false })[0]).not.toHaveProperty("accent");
  });

  it("names the path of what it cannot evaluate", async () => {
    const lib = await readBlueprint(rackRoom);
    // The example snaps the gear by its rig's centre, a rig socket: the engine's (P3).
    expect(() => flatten(lib, "rack-room")).toThrow(
      '/scenes/rack-room/root/instances/2/snap/socket: no socket "c"',
    );
    const file = clone(rackRoom);
    file.scenes!["rack-room"]!.root.instances[2] = { id: "g", use: "gear", at: [0, 0, 8] } as never;
    const still = await readBlueprint(file);
    expect(() => flatten(still, "rack-room")).toThrow(
      "/parts/gear/prims/0: rig prims are drawn by the engine",
    );
  });
});

describe("convert", () => {
  const T = [0, 0.37, 1.7, 4.3, 9.2, 31.4];
  const sample = (name: "cube" | "stack"): Sample[] =>
    T.flatMap((t) =>
      [-1, 0, 2].map((active) => ({
        input: { t, active },
        blocks: { cube, stack }[name]({ t, active }).blocks,
      })),
    );

  it.each(["cube", "stack"] as const)("flattens %s back to its static blocks", async (name) => {
    const samples = sample(name);
    const converted = convertScene(samples, { name, prefix: "examples" });
    const lib = await readBlueprint(writeBlueprint(converted.file));
    for (const s of samples) {
      const expected = staticBlocks(s.blocks, converted.counts);
      const vars = { active: s.input.active! };
      expect(flatten(lib, name, vars)).toStrictEqual(expected);
    }
    // The renderer draws the same frame from both.
    const original: Block[] = staticBlocks(samples[0]!.blocks, converted.counts);
    const a = render({ blocks: original }, { width: 240, height: 160 });
    const b = render({ blocks: flatten(lib, name) }, { width: 240, height: 160 });
    expect(b.frame).toStrictEqual(a.frame);
  });

  it("reports what varies and with what", () => {
    const report = convertScene(sample("stack"), { name: "stack" }).report;
    expect(report.inputs).toEqual(["active", "t"]);
    expect(report.static).toBe(4); // the posts
    expect(report.ordered).toBe(true);
    const cube = convertScene(sample("cube"), { name: "cube" }).report;
    expect(cube.inputs).toEqual(["t"]);
  });

  it("normalizes false flags and negative zeros", () => {
    expect(
      normalizeBlock({ kind: "box", at: [-0, 0, 1], size: [1, 1, 1], accent: false }),
    ).toStrictEqual({
      kind: "box",
      at: [0, 0, 1],
      size: [1, 1, 1],
    });
  });
});
