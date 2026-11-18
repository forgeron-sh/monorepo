//! A scene read from a SceneBin: its still picture as blocks (`flatten` of `format/flatten.ts`,
//! operation for operation: params, instances, quarter turns, uniform scale, socket snaps), and
//! the state a handle keeps between calls. Rigs and sprites are P3: skipped here.

use crate::bin::{Choice, Def, Flag, Prim, SceneBin};
use crate::block::{flags, Block, BlockKind};
use crate::layout::code;
use fg_math::vec::{no_neg_zero as z, rotate};
use fg_math::{num::truthy, Turn, Vec3};

/// world = t + R(turn)(s · p)
#[derive(Clone, Copy, Debug, PartialEq)]
struct Transform {
    s: f64,
    turn: Turn,
    t: Option<Vec3>,
    layer: Option<f64>,
    /// Hover tag inherited from the nearest tagged instance (string index + 1).
    tag: u16,
}

const IDENTITY: Transform = Transform {
    s: 1.0,
    turn: 0,
    t: None,
    layer: None,
    tag: 0,
};

fn point(t: &Transform, p: Vec3) -> Vec3 {
    let q = if t.s == 1.0 {
        p
    } else {
        [p[0] * t.s, p[1] * t.s, p[2] * t.s]
    };
    let q = rotate(q, t.turn);
    match t.t {
        Some(o) => [q[0] + o[0], q[1] + o[1], q[2] + o[2]],
        None => q,
    }
}

fn out3(p: Vec3) -> Vec3 {
    [z(p[0]), z(p[1]), z(p[2])]
}

fn compose(parent: &Transform, child: &Transform) -> Transform {
    let t = match child.t {
        Some(ct) => Some(point(
            &Transform {
                layer: None,
                ..*parent
            },
            ct,
        )),
        None => parent.t,
    };
    let layer = match (parent.layer, child.layer) {
        (None, c) => c,
        (Some(p), None) => Some(p),
        (Some(p), Some(c)) => Some(p + c),
    };
    Transform {
        s: parent.s * child.s,
        turn: (parent.turn + child.turn) % 4,
        t,
        layer,
        tag: if child.tag != 0 {
            child.tag
        } else {
            parent.tag
        },
    }
}

/// A corner box of a part's frame placed by `t`: an axis-aligned box again.
fn place_box(t: &Transform, at: Vec3, size: Vec3) -> (Vec3, Vec3) {
    let (mut a, mut s) = (at, size);
    if t.s != 1.0 {
        a = [a[0] * t.s, a[1] * t.s, a[2] * t.s];
        s = [s[0] * t.s, s[1] * t.s, s[2] * t.s];
    }
    let [x, y, h] = a;
    let [w, d, sz] = s;
    match t.turn {
        1 => {
            a = [-(y + d), x, h];
            s = [d, w, sz];
        }
        2 => a = [-(x + w), -(y + d), h],
        3 => {
            a = [y, -(x + w), h];
            s = [d, w, sz];
        }
        _ => {}
    }
    if let Some(o) = t.t {
        a = [a[0] + o[0], a[1] + o[1], a[2] + o[2]];
    }
    (a, s)
}

struct Placed {
    inst: usize,
    def: usize,
    scope: Vec<f64>,
    t: Transform,
}

enum Slot {
    Todo,
    Busy,
    Done(Placed),
}

pub struct Flattener<'a> {
    pub bin: &'a SceneBin,
    depth: usize,
}

type R<T> = Result<T, String>;

impl<'a> Flattener<'a> {
    pub fn new(bin: &'a SceneBin) -> Self {
        Self { bin, depth: 0 }
    }

    fn name(&self, s: usize) -> &str {
        &self.bin.strings[s]
    }

    fn num(&self, i: usize, scope: &[f64]) -> f64 {
        let n = self.bin.nums[i];
        let v = |a: f64| scope.get(a as usize).copied().unwrap_or(f64::NAN);
        match n.kind {
            code::num::PARAM => v(n.a),
            code::num::LINEAR => n.b + n.k * v(n.a),
            _ => n.a,
        }
    }

    fn vec(&self, i: usize, scope: &[f64]) -> Vec3 {
        [
            self.num(i, scope),
            self.num(i + 1, scope),
            self.num(i + 2, scope),
        ]
    }

    fn flag(&self, f: &Flag, scope: &[f64]) -> bool {
        let v = |a: f64| scope.get(a as usize).copied().unwrap_or(f64::NAN);
        match f.kind {
            code::flag::PARAM => truthy(v(f.a)),
            code::flag::NOT => !truthy(v(f.a)),
            _ => f.a != 0.0,
        }
    }

    fn choose(&self, c: &Choice, scope: &[f64]) -> i32 {
        if self.flag(&c.flag, scope) {
            c.then
        } else {
            c.otherwise
        }
    }

    fn emit_prim(&self, prim: &Prim, t: &Transform, scope: &[f64], out: &mut Vec<Block>) {
        if let Some(v) = &prim.visible {
            if !self.flag(v, scope) {
                return;
            }
        }
        let layer = match (t.layer, prim.layer) {
            (None, p) => p,
            (Some(l), None) => Some(l),
            (Some(l), Some(p)) => Some(l + p),
        };
        let tag = prim.tag.map_or(t.tag, |s| (s + 1) as u16);
        let base = |mut b: Block, out: &mut Vec<Block>| {
            if let Some(l) = layer {
                b.layer = z(l);
            }
            if prim.decor {
                b.flags |= flags::DECOR;
            }
            b.tag = tag;
            out.push(b);
        };
        let ink = |b: &mut Block| {
            if let Some(c) = &prim.ink {
                let slot = self.choose(c, scope);
                if slot > 0 {
                    b.ink = slot as u8;
                }
            }
        };
        match prim.kind {
            code::prim::BOX => {
                let (Some(at), Some(size)) = (prim.at, prim.size) else {
                    return;
                };
                let mut corner = self.vec(at, scope);
                let size = self.vec(size, scope);
                if prim.anchor == code::anchor::BASE_CENTRE {
                    corner = [
                        corner[0] - size[0] / 2.0,
                        corner[1] - size[1] / 2.0,
                        corner[2],
                    ];
                }
                let (a, s) = place_box(t, corner, size);
                let mut b = Block::new(BlockKind::Box);
                b.a = out3(a);
                b.b = out3(s);
                if let Some(tone) = prim.tone {
                    let v = self.vec(tone, scope);
                    b.tone = if t.turn % 2 == 1 {
                        [v[0], v[2], v[1]]
                    } else {
                        v
                    };
                    b.flags |= flags::HAS_TONE;
                }
                if let Some(look) = &prim.look {
                    b.flags |= match self.choose(look, scope) {
                        code::look::ACCENT => flags::ACCENT,
                        code::look::SIGNAL => flags::SIGNAL,
                        code::look::ALERT => flags::ALERT,
                        code::look::GHOST => flags::GHOST,
                        _ => 0,
                    };
                }
                if prim.plate {
                    b.flags |= flags::PLATE;
                }
                if let Some(f) = prim.floors {
                    let floors = self.num(f, scope);
                    b.floors = z(if t.s == 1.0 { floors } else { floors * t.s });
                }
                // Vents on a face of the part's frame: today's renderer draws the +x face only
                // (the reader refuses +y; -x and -y are hidden).
                if prim.vents >= 0 && (prim.vents + t.turn as i32) % 4 == code::vents::PX {
                    b.flags |= flags::VENTS;
                }
                base(b, out);
            }
            code::prim::LINE => {
                let pts: Vec<Vec3> = prim
                    .points
                    .clone()
                    .map(|k| out3(point(t, self.vec(self.bin.points[k], scope))))
                    .collect();
                for k in 0..pts.len().saturating_sub(1) {
                    let mut b = Block::new(BlockKind::Line);
                    b.a = pts[k];
                    b.b = pts[k + 1];
                    ink(&mut b);
                    if let Some(dash) = prim.dash {
                        b.dash = dash;
                    }
                    base(b, out);
                }
            }
            code::prim::DOT => {
                let Some(at) = prim.at else { return };
                let mut b = Block::new(BlockKind::Dot);
                b.a = out3(point(t, self.vec(at, scope)));
                ink(&mut b);
                if let Some(size) = prim.dot_size {
                    b.size = size;
                }
                base(b, out);
            }
            code::prim::LABEL => {
                let Some(at) = prim.at else { return };
                let mut b = Block::new(BlockKind::Label);
                b.a = out3(point(t, self.vec(at, scope)));
                b.text = prim
                    .text
                    .map(|s| self.bin.strings[s].clone())
                    .unwrap_or_default();
                if let Some(to) = prim.to {
                    b.b = out3(point(t, self.vec(to, scope)));
                    b.flags |= flags::HAS_TO;
                }
                if let Some(a) = &prim.active {
                    if self.flag(a, scope) {
                        b.flags |= flags::ACTIVE;
                    }
                }
                if prim.plain {
                    b.flags |= flags::PLAIN;
                }
                if prim.fixed {
                    b.flags |= flags::FIXED;
                }
                ink(&mut b);
                base(b, out);
            }
            // Rigs and sprites are drawn by the engine from P3 on.
            _ => {}
        }
    }

    /// The scope of a definition used by an instance: its param defaults, then the instance's values.
    fn scope_of(&self, def: &Def, inst: usize, parent: &[f64]) -> Vec<f64> {
        let mut scope: Vec<f64> = self.bin.params[def.params.clone()]
            .iter()
            .map(|p| p.default)
            .collect();
        for a in &self.bin.args[self.bin.instances[inst].args.clone()] {
            let value = if a.kind == code::arg::FLAG {
                if self.flag(&a.flag, parent) {
                    1.0
                } else {
                    0.0
                }
            } else {
                self.num(a.num, parent)
            };
            if let Some(slot) = scope.get_mut(a.param) {
                *slot = value;
            }
        }
        scope
    }

    /// A socket of a definition, in the definition's own frame.
    fn socket_of(&self, def: usize, name: &str, scope: &[f64]) -> R<Vec3> {
        let d = &self.bin.defs[def];
        let socket = self.bin.sockets[d.sockets.clone()]
            .iter()
            .find(|s| self.name(s.name) == name)
            .ok_or_else(|| format!("{}: no socket \"{name}\"", self.name(d.name)))?;
        if socket.kind == code::socket::POINT {
            let at = socket.at.ok_or("socket without a point")?;
            return Ok(self.vec(at, scope));
        }
        let placed = self.place(d, scope)?;
        let inst = socket.instance.ok_or("socket without an instance")?;
        let inner = socket.socket.map(|s| self.name(s)).unwrap_or_default();
        let p = placed.get(inst).ok_or("socket instance out of range")?;
        Ok(point(&p.t, self.socket_of(p.def, inner, &p.scope)?))
    }

    fn resolve(&self, asm: &Def, scope: &[f64], k: usize, slots: &mut Vec<Slot>) -> R<()> {
        match slots[k] {
            Slot::Done(_) => return Ok(()),
            Slot::Busy => return Err(format!("{}: snap cycle", self.name(asm.name))),
            Slot::Todo => {}
        }
        slots[k] = Slot::Busy;
        let index = asm.instances.start + k;
        let inst = &self.bin.instances[index];
        let def = &self.bin.defs[inst.def];
        let inner = self.scope_of(def, index, scope);
        let mut t = Transform {
            s: inst.scale,
            turn: inst.turn,
            t: inst.at.map(|at| self.vec(at, scope)),
            layer: inst.layer,
            tag: inst.tag.map_or(0, |s| (s + 1) as u16),
        };
        if let (Some(to), Some(socket)) = (inst.snap_to, inst.snap_socket) {
            if to >= slots.len() {
                return Err("snap target out of range".into());
            }
            self.resolve(asm, scope, to, slots)?;
            let Slot::Done(target) = &slots[to] else {
                unreachable!()
            };
            let to_socket = inst
                .snap_to_socket
                .map(|s| self.name(s))
                .unwrap_or_default();
            let target = point(
                &target.t,
                self.socket_of(target.def, to_socket, &target.scope)?,
            );
            let mine = point(
                &Transform { t: None, ..t },
                self.socket_of(inst.def, self.name(socket), &inner)?,
            );
            let base = t.t.unwrap_or([0.0; 3]);
            t.t = Some([
                base[0] + target[0] - mine[0],
                base[1] + target[1] - mine[1],
                base[2] + target[2] - mine[2],
            ]);
        }
        slots[k] = Slot::Done(Placed {
            inst: index,
            def: inst.def,
            scope: inner,
            t,
        });
        Ok(())
    }

    /// Every instance of an assembly with its scope and its transform in the assembly's frame.
    fn place(&self, asm: &Def, scope: &[f64]) -> R<Vec<Placed>> {
        let n = asm.instances.len();
        let mut slots: Vec<Slot> = (0..n).map(|_| Slot::Todo).collect();
        for k in 0..n {
            self.resolve(asm, scope, k, &mut slots)?;
        }
        Ok(slots
            .into_iter()
            .map(|s| match s {
                Slot::Done(p) => p,
                _ => unreachable!(),
            })
            .collect())
    }

    fn emit_assembly(
        &mut self,
        def: usize,
        scope: &[f64],
        t: &Transform,
        out: &mut Vec<Block>,
    ) -> R<()> {
        self.depth += 1;
        if self.depth > 64 {
            return Err("instances nest deeper than 64: a cycle?".into());
        }
        let asm = &self.bin.defs[def];
        for p in self.place(asm, scope)? {
            let inst = &self.bin.instances[p.inst];
            if let Some(v) = &inst.visible {
                if !self.flag(v, scope) {
                    continue;
                }
            }
            let world = compose(t, &p.t);
            let d = &self.bin.defs[p.def];
            if d.kind == code::def::PART {
                for prim in &self.bin.prims[d.prims.clone()] {
                    self.emit_prim(prim, &world, &p.scope, out);
                }
            } else {
                self.emit_assembly(p.def, &p.scope, &world, out)?;
            }
        }
        self.depth -= 1;
        Ok(())
    }

    /// The still picture of the scene at the root scope `vars` (`t`, the vars, the root's params).
    pub fn flatten(&mut self, vars: &[f64], out: &mut Vec<Block>) -> R<()> {
        out.clear();
        self.depth = 0;
        let view = self.bin.scene.view;
        let t = if view != 0 {
            Transform {
                turn: view,
                ..IDENTITY
            }
        } else {
            IDENTITY
        };
        self.emit_assembly(self.bin.scene.root, vars, &t, out)
    }
}

impl SceneBin {
    /// The root scope's defaults: `t`, the vars, then the root's params.
    pub fn root_defaults(&self) -> Vec<f64> {
        let root = &self.defs[self.scene.root];
        self.params[root.params.clone()]
            .iter()
            .map(|p| p.default)
            .collect()
    }
}
