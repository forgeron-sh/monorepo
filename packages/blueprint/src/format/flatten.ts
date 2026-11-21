/**
 * The reference evaluator of the format for still pictures: a scene of a resolved library, at
 * given var values, as the block list today's renderer draws. It covers params, instances,
 * quarter turns, uniform scale and socket snaps; timelines, machines and rigs belong to the
 * engine (P3) and are not evaluated here.
 *
 * Exactness: an identity placement (no `at`, `turn` 0, `scale` 1) does no arithmetic at all, so a
 * converted scene flattens to the very float64 values it was written with. A negative zero is
 * written as 0 (JSON cannot keep it, and no renderer tells them apart).
 */
import { BlueprintError } from "../core/blocks";
import type { Block, BoxBlock, Ink, Vec3 } from "../core/types";
import type { Library } from "./read";
import type {
  Assembly,
  BoxLook,
  Flag,
  InkRef,
  Instance,
  Num,
  NumVec,
  Part,
  Prim,
  SideFace,
  Turn,
} from "./types";

type Value = number | boolean;
type Scope = ReadonlyMap<string, Value>;
type Where = () => string;

/** world = t + R(turn)(s · p) */
interface Transform {
  s: number;
  turn: Turn;
  t: Vec3 | undefined;
  layer: number | undefined;
}

const IDENTITY: Transform = { s: 1, turn: 0, t: undefined, layer: undefined };

const fail = (where: Where, message: string): never => {
  throw new BlueprintError(`${where()}: ${message}`);
};

/** -0 → 0, everything else unchanged. */
const z = (x: number) => (x === 0 ? 0 : x);

function lookup(scope: Scope, ref: string, where: Where): Value {
  const value = scope.get(ref.slice(1));
  return value === undefined ? fail(where, `unknown parameter "${ref}"`) : value;
}

function num(n: Num, scope: Scope, where: Where): number {
  if (typeof n === "number") return n;
  if (typeof n === "string") {
    const v = lookup(scope, n, where);
    return typeof v === "number" ? v : fail(where, `"${n}" is a flag, a number is needed`);
  }
  const v = lookup(scope, `@${n.p}`, where);
  if (typeof v !== "number") return fail(where, `"@${n.p}" is a flag, a number is needed`);
  return (n.b ?? 0) + (n.k ?? 1) * v;
}

function flag(f: Flag, scope: Scope, where: Where): boolean {
  if (typeof f === "boolean") return f;
  if (typeof f === "string") return Boolean(lookup(scope, f, where));
  return !lookup(scope, f.not, where);
}

function ink(i: InkRef, scope: Scope, where: Where): Ink {
  return typeof i === "string" ? i : flag(i.if, scope, where) ? i.then : i.else;
}

function vec(v: NumVec, scope: Scope, where: Where): Vec3 {
  return [num(v[0], scope, where), num(v[1], scope, where), num(v[2], scope, where)];
}

function rotate(p: Vec3, turn: Turn): Vec3 {
  switch (turn) {
    case 0:
      return p;
    case 1:
      return [-p[1], p[0], p[2]];
    case 2:
      return [-p[0], -p[1], p[2]];
    case 3:
      return [p[1], -p[0], p[2]];
  }
}

function point(T: Transform, p: Vec3): Vec3 {
  let q = T.s === 1 ? p : ([p[0] * T.s, p[1] * T.s, p[2] * T.s] as Vec3);
  q = rotate(q, T.turn);
  return T.t ? [q[0] + T.t[0], q[1] + T.t[1], q[2] + T.t[2]] : q;
}

const out3 = (p: Vec3): Vec3 => [z(p[0]), z(p[1]), z(p[2])];

function compose(parent: Transform, child: Transform): Transform {
  const t = child.t ? point({ ...parent, layer: undefined }, child.t) : parent.t;
  const layer =
    parent.layer === undefined
      ? child.layer
      : child.layer === undefined
        ? parent.layer
        : parent.layer + child.layer;
  return { s: parent.s * child.s, turn: ((parent.turn + child.turn) % 4) as Turn, t, layer };
}

const SIDES: SideFace[] = ["+x", "+y", "-x", "-y"];

/** A corner box of the part's frame, placed by `T`: an axis-aligned box again. */
function placeBox(T: Transform, at: Vec3, size: Vec3): { at: Vec3; size: Vec3 } {
  let a = at;
  let s = size;
  if (T.s !== 1) {
    a = [a[0] * T.s, a[1] * T.s, a[2] * T.s];
    s = [s[0] * T.s, s[1] * T.s, s[2] * T.s];
  }
  const [x, y, h] = a;
  const [w, d, sz] = s;
  switch (T.turn) {
    case 1:
      a = [-(y + d), x, h];
      s = [d, w, sz];
      break;
    case 2:
      a = [-(x + w), -(y + d), h];
      break;
    case 3:
      a = [y, -(x + w), h];
      s = [d, w, sz];
      break;
  }
  if (T.t) a = [a[0] + T.t[0], a[1] + T.t[1], a[2] + T.t[2]];
  return { at: a, size: s };
}

function layerOf(T: Transform, prim: number | undefined): number | undefined {
  if (T.layer === undefined) return prim;
  return prim === undefined ? T.layer : T.layer + prim;
}

function emitPrim(prim: Prim, T: Transform, scope: Scope, where: Where, out: Block[]): void {
  if (prim.visible !== undefined && !flag(prim.visible, scope, where)) return;
  const layer = layerOf(T, prim.layer);
  const base = (b: Block) => {
    if (layer !== undefined) b.layer = z(layer);
    if (prim.decor) b.decor = true;
    out.push(b);
  };
  switch (prim.kind) {
    case "box": {
      let corner = vec(prim.at, scope, where);
      const size = vec(prim.size, scope, where);
      if (prim.anchor === "base-centre")
        corner = [corner[0] - size[0] / 2, corner[1] - size[1] / 2, corner[2]];
      const placed = placeBox(T, corner, size);
      const b: BoxBlock = { kind: "box", at: out3(placed.at), size: out3(placed.size) };
      if (prim.tone) {
        const tone = vec(prim.tone, scope, where);
        b.tone = T.turn % 2 ? [tone[0], tone[2], tone[1]] : tone;
      }
      if (prim.look !== undefined) {
        const look: BoxLook =
          typeof prim.look === "string"
            ? prim.look
            : flag(prim.look.if, scope, where)
              ? prim.look.then
              : prim.look.else;
        if (look !== "plain") b[look] = true;
      }
      if (prim.plate) b.plate = true;
      if (prim.floors !== undefined) {
        const floors = num(prim.floors, scope, where);
        b.floors = z(T.s === 1 ? floors : floors * T.s);
      }
      if (prim.vents !== undefined) {
        const face = SIDES[(SIDES.indexOf(prim.vents) + T.turn) % 4]!;
        // Vents on a hidden face (-x, -y) are not seen; today's renderer draws the +x face only.
        if (face === "+y")
          fail(where, "vents on the +y face: today's renderer draws vents on +x only");
        if (face === "+x") b.vents = true;
      }
      return base(b);
    }
    case "line": {
      const points = prim.points.map((p) => out3(point(T, vec(p, scope, where))));
      const lineInk = prim.ink === undefined ? undefined : ink(prim.ink, scope, where);
      for (let k = 0; k + 1 < points.length; k++) {
        const b: Block = { kind: "line", a: points[k]!, b: points[k + 1]! };
        if (lineInk !== undefined) b.ink = lineInk;
        if (prim.dash !== undefined) b.dash = prim.dash;
        base(b);
      }
      return;
    }
    case "dot": {
      const b: Block = { kind: "dot", at: out3(point(T, vec(prim.at, scope, where))) };
      if (prim.ink !== undefined) b.ink = ink(prim.ink, scope, where);
      if (prim.size !== undefined) b.size = prim.size;
      return base(b);
    }
    case "label": {
      const b: Block = {
        kind: "label",
        at: out3(point(T, vec(prim.at, scope, where))),
        text: prim.text,
      };
      if (prim.to) b.to = out3(point(T, vec(prim.to, scope, where)));
      if (prim.active !== undefined && flag(prim.active, scope, where)) b.active = true;
      if (prim.plain) b.plain = true;
      if (prim.fixed) b.fixed = true;
      if (prim.ink !== undefined) b.ink = ink(prim.ink, scope, where);
      return base(b);
    }
    case "rig":
    case "sprite":
      return fail(where, `${prim.kind} prims are drawn by the engine (P3), not by flatten`);
  }
}

interface Ctx {
  lib: Library;
  out: Block[];
  depth: number;
}

type Def = { kind: "part"; part: Part } | { kind: "assembly"; assembly: Assembly };

function definition(ctx: Ctx, name: string, where: Where): Def {
  const part = ctx.lib.parts.get(name);
  if (part) return { kind: "part", part };
  const assembly = ctx.lib.assemblies.get(name);
  if (assembly) return { kind: "assembly", assembly };
  return fail(where, `"${name}" is not defined`);
}

/** The scope of a definition used by an instance: its param defaults, then the instance's values. */
function scopeOf(def: Def, inst: Instance, parent: Scope, where: Where): Scope {
  const specs = (def.kind === "part" ? def.part.params : def.assembly.params) ?? {};
  const scope = new Map<string, Value>();
  for (const [name, spec] of Object.entries(specs)) scope.set(name, spec.default);
  for (const [name, value] of Object.entries(inst.params ?? {})) {
    if (!Object.hasOwn(specs, name)) fail(where, `"${inst.use}" has no parameter "${name}"`);
    const spec = specs[name]!;
    scope.set(
      name,
      spec.type === "flag" ? flag(value as Flag, parent, where) : num(value as Num, parent, where),
    );
  }
  return scope;
}

/** A socket of a definition, in the definition's own frame. */
function socketOf(ctx: Ctx, def: Def, name: string, scope: Scope, where: Where): Vec3 {
  if (def.kind === "part") {
    const socket = def.part.sockets?.[name];
    if (!socket) return fail(where, `no socket "${name}"`);
    return vec(socket.at, scope, where);
  }
  const path = def.assembly.sockets?.[name];
  if (!path) return fail(where, `no socket "${name}"`);
  const { byId } = placeInstances(ctx, def.assembly, scope, where);
  return socketAt(ctx, byId, path, where);
}

interface Placed {
  inst: Instance;
  def: Def;
  scope: Scope;
  T: Transform;
}

/** The point `"instance.socket"` names, in the frame of the assembly that holds the instance. */
function socketAt(ctx: Ctx, placed: Map<string, () => Placed>, path: string, where: Where): Vec3 {
  const [id, socket] = path.split(".") as [string, string];
  const get = placed.get(id);
  if (!get) return fail(where, `no instance "${id}"`);
  const p = get();
  return point(p.T, socketOf(ctx, p.def, socket, p.scope, where));
}

interface Instances {
  byId: Map<string, () => Placed>;
  order: (() => Placed)[];
}

/** Every instance of an assembly with its scope and its transform in the assembly's frame. */
function placeInstances(ctx: Ctx, assembly: Assembly, scope: Scope, where: Where): Instances {
  const byId = new Map<string, () => Placed>();
  const order: (() => Placed)[] = [];
  assembly.instances.forEach((inst, i) => {
    const here: Where = () => `${where()}/instances/${i}`;
    let done: Placed | undefined;
    let busy = false;
    const get = (): Placed => {
      if (done) return done;
      if (busy) return fail(here, "snap cycle");
      busy = true;
      const def = definition(ctx, inst.use, () => `${here()}/use`);
      const inner = scopeOf(def, inst, scope, here);
      const T: Transform = {
        s: inst.scale ?? 1,
        turn: inst.turn ?? 0,
        t: inst.at ? vec(inst.at, scope, () => `${here()}/at`) : undefined,
        layer: inst.layer,
      };
      if (inst.snap) {
        const target = socketAt(ctx, byId, inst.snap.to, () => `${here()}/snap/to`);
        const mine = point(
          { ...T, t: undefined },
          socketOf(ctx, def, inst.snap.socket, inner, () => `${here()}/snap/socket`),
        );
        const base = T.t ?? [0, 0, 0];
        T.t = [
          base[0] + target[0] - mine[0],
          base[1] + target[1] - mine[1],
          base[2] + target[2] - mine[2],
        ];
      }
      done = { inst, def, scope: inner, T };
      busy = false;
      return done;
    };
    if (inst.id !== undefined) byId.set(inst.id, get);
    order.push(get);
  });
  return { byId, order };
}

function emitAssembly(ctx: Ctx, assembly: Assembly, scope: Scope, T: Transform, where: Where) {
  if (++ctx.depth > 64) fail(where, "instances nest deeper than 64: a cycle?");
  placeInstances(ctx, assembly, scope, where).order.forEach((get, i) => {
    const here: Where = () => `${where()}/instances/${i}`;
    const p = get();
    if (p.inst.visible !== undefined && !flag(p.inst.visible, scope, here)) return;
    const world = compose(T, p.T);
    if (p.def.kind === "part") {
      const part = p.def.part;
      const name = p.inst.use;
      part.prims.forEach((prim, k) =>
        emitPrim(prim, world, p.scope, () => `/parts/${name}/prims/${k}`, ctx.out),
      );
    } else emitAssembly(ctx, p.def.assembly, p.scope, world, () => `/assemblies/${p.inst.use}`);
  });
  ctx.depth--;
}

/**
 * The still picture of `scene` as blocks: the root assembly's instances, depth first, in order,
 * each prim at its world place. `vars` sets the scene's vars and the root's params by name (the
 * scene's `t` is 0 and every other var takes its default otherwise).
 */
export function flatten(
  lib: Library,
  scene: string,
  vars: Readonly<Record<string, number | boolean>> = {},
): Block[] {
  const s = lib.scenes.get(scene);
  if (!s) throw new BlueprintError(`no scene "${scene}" in ${lib.file.id}`);
  const scope = new Map<string, Value>([["t", 0]]);
  for (const [name, v] of Object.entries(s.vars ?? {}))
    if (v.type === "int") scope.set(name, v.default);
    else if (v.type === "progress") scope.set(name, v.default ?? 0);
  for (const [name, spec] of Object.entries(s.root.params ?? {})) scope.set(name, spec.default);
  for (const [name, v] of Object.entries(vars)) scope.set(name, v);
  const ctx: Ctx = { lib, out: [], depth: 0 };
  const T: Transform = s.camera.view ? { ...IDENTITY, turn: s.camera.view } : IDENTITY;
  emitAssembly(ctx, s.root, scope, T, () => `/scenes/${scene}/root`);
  return ctx.out;
}
