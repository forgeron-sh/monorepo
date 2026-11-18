import { describe, expect, it } from "vitest";
import { readBlueprint } from "../format/read";
import type { BlueprintFile, Scene } from "../format/types";
import { createScene } from "./scene";

/** A one-box scene with `scene` merged into its scene record. */
function file(scene: Partial<Scene>, params: Record<string, unknown> = {}): BlueprintFile {
  return {
    $schema: "https://blueprint.forgeron.sh/schema/v1.json",
    version: 1,
    id: "test/player",
    parts: {
      box: {
        params: params as never,
        prims: [{ kind: "box", at: [0, 0, 0], size: [2, 2, 2] }],
      },
    },
    scenes: {
      s: {
        title: "player",
        depth: "painter",
        camera: { view: 0, fit: {} },
        root: { instances: [{ id: "b", use: "box" }] },
        ...scene,
      } as Scene,
    },
  };
}

async function scene(f: BlueprintFile) {
  const s = createScene(await readBlueprint(f, { location: "player.bp.json" }), "s");
  s.resize(32, 32);
  return s;
}

describe("machines", () => {
  it("take progress windows, `*` transitions and hold their `set` under the host's", async () => {
    const s = await scene(
      file({
        vars: {
          progress: { type: "progress" },
          step: { type: "int", default: -1 },
        },
        machines: {
          story: {
            initial: "intro",
            states: {
              intro: { set: { step: 0 } },
              boom: { set: { step: 1 } },
              out: { set: { step: 2 } },
            },
            transitions: [
              { from: "*", to: "intro", when: { var: "progress", range: [0, 0.4] } },
              { from: "*", to: "boom", when: { var: "progress", range: [0.4, 0.8] } },
              { from: "*", to: "out", when: { var: "progress", range: [0.8, 1.01] } },
            ],
          },
        },
      }),
    );
    const states: string[] = [];
    s.on("state", (_, name) => states.push(name));
    for (const p of [0, 0.2, 0.5, 0.79, 0.8, 1, 0.1]) {
      s.set("progress", p);
      s.frame(0);
      states.push(`${p}:${s.state()}:${s.get("step")}`);
    }
    expect(states.filter((x) => x.includes(":"))).toEqual([
      "0:intro:0",
      "0.2:intro:0",
      "0.5:boom:1",
      "0.79:boom:1",
      "0.8:out:2",
      "1:out:2",
      "0.1:intro:0",
    ]);
    // The first frame reports the initial state, then each change.
    expect(states.filter((x) => !x.includes(":"))).toEqual(["intro", "boom", "out", "intro"]);
    // The host's value wins over a state's `set`; released, the state's comes back.
    s.set("step", 7);
    s.frame(0);
    expect(s.get("step")).toBe(7);
    s.release("step");
    s.frame(0);
    expect(s.get("step")).toBe(0);
    s.dispose();
  });

  it("leave a state `after` its time and on host events", async () => {
    const s = await scene(
      file({
        machines: {
          m: {
            initial: "idle",
            states: { idle: {}, busy: {}, done: {} },
            transitions: [
              { from: "idle", to: "busy", when: { event: "click:cta" } },
              { from: "busy", to: "done", when: { after: 1.5 } },
              { from: "done", to: "idle", when: { event: "reset" } },
            ],
          },
        },
      }),
    );
    s.frame(0);
    expect(s.state()).toBe("idle");
    s.emit("unknown"); // dropped: no transition listens to it
    s.frame(0.5);
    expect(s.state()).toBe("idle");
    s.emit("click:cta");
    s.frame(1);
    expect(s.state()).toBe("busy");
    s.frame(2.4);
    expect(s.state()).toBe("busy");
    s.frame(2.5);
    expect(s.state()).toBe("done");
    s.emit("reset");
    s.frame(3);
    expect(s.state()).toBe("idle");
    s.dispose();
  });

  it("run a state's timelines on the time since it was entered", async () => {
    const s = await scene(
      file(
        {
          timelines: {
            grow: {
              tracks: [
                {
                  kind: "key",
                  target: "b",
                  channel: "param:h",
                  keys: [
                    { t: 0, v: 1 },
                    { t: 2, v: 5 },
                  ],
                },
              ],
            },
          },
          machines: {
            m: {
              initial: "rest",
              states: { rest: {}, go: { play: ["grow"] } },
              transitions: [{ from: "rest", to: "go", when: { event: "go" } }],
            },
          },
        },
        { h: { type: "number", default: 0 } },
      ),
    );
    // The part's param `h` is not drawn: the frame's flags say whether anything changed.
    expect(s.frame(10) & 2).toBe(2); // the first frame: everything is new
    expect(s.frame(11) & 2).toBe(0); // `grow` does not play in `rest`
    s.emit("go");
    expect(s.frame(12) & 2).toBe(2); // entered `go`: h = 1
    expect(s.frame(13) & 2).toBe(2); // h = 3
    s.frame(14);
    expect(s.frame(15) & 2).toBe(0); // h holds at 5 past the last key
    s.dispose();
  });
});

describe("vars", () => {
  it("cycle an int var as `mount` does, until the host pins it", async () => {
    const s = await scene(
      file({ vars: { active: { type: "int", default: -1, cycle: { every: 2, count: 9 } } } }),
    );
    const seen: number[] = [];
    s.on("active", (v) => seen.push(v));
    for (const t of [0, 1.9, 2, 5.9, 17.99, 18]) {
      s.frame(t);
      expect(s.get("active")).toBe(Math.floor(t / 2) % 9);
    }
    s.set("active", 4);
    s.frame(19);
    expect(s.get("active")).toBe(4);
    s.release("active");
    s.frame(20);
    expect(s.get("active")).toBe(1);
    expect(seen).toEqual([0, 1, 2, 8, 0, 4, 1]);
    expect(() => s.set("nope", 1)).toThrow(/no var or root param "nope"/);
    s.dispose();
  });
});
