//! A scene read from a SceneBin: its picture as blocks (`flatten` of `format/flatten.ts`,
//! operation for operation: params, instances, quarter turns, uniform scale, socket snaps), with
//! what the timelines set this frame (`Overrides`), the rigs drawn from their settings and the
//! conveyors' copies after the root. Sprites are v1.1: skipped.

use crate::bin::{Choice, Def, Flag, Prim, RigArg, SceneBin};
use crate::block::{flags, Block, BlockKind};
use crate::layout::code;
use crate::rigs;
use crate::tracks::Overrides;
use fg_math::vec::{no_neg_zero as z, rotate};
use fg_math::{num::truthy, Turn, Vec3};
use std::ops::Range;

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
    over: Option<&'a Overrides>,
    depth: usize,
    rig_out: Vec<Block>,
}

/// The settings of a rig prim, evaluated in its part's scope.
struct RigSettings<'b, 'a> {
    f: &'b Flattener<'a>,
    args: &'b [RigArg],
    scope: &'b [f64],
}

impl RigSettings<'_, '_> {
    fn find(&self, name: &str) -> Option<&RigArg> {
        self.args.iter().find(|a| self.f.name(a.name) == name)
    }
}

impl rigs::Settings for RigSettings<'_, '_> {
    fn num(&self, name: &str) -> Option<f64> {
        let a = self.find(name)?;
        match a.kind {
            code::rig_arg::NUM => Some(self.f.num(a.num, self.scope)),
            code::rig_arg::FLAG => Some(if self.f.flag(&a.flag, self.scope) {
                1.0
            } else {
                0.0
            }),
            _ => None,
        }
    }

    fn vec(&self, name: &str) -> Option<Vec3> {
        let a = self.find(name)?;
        (a.kind == code::rig_arg::VEC).then(|| self.f.vec(a.num, self.scope))
    }

    fn ink(&self, name: &str) -> Option<u8> {
        let a = self.find(name)?;
        let code = match a.kind {
            code::rig_arg::INK => self.f.choose(
                &Choice {
                    flag: a.flag,
                    then: a.then,
                    otherwise: a.otherwise,
                },
                self.scope,
            ),
            code::rig_arg::NAME => match a.text.map(|t| self.f.name(t)) {
                Some("ink") => code::ink::INK,
                Some("dim") => code::ink::DIM,
                Some("faint") => code::ink::FAINT,
                Some("accent") => code::ink::ACCENT,
                Some("signal") => code::ink::SIGNAL,
                Some("alert") => code::ink::ALERT,
                _ => 0,
            },
            _ => 0,
        };
        (code > 0).then_some(code as u8)
    }

    fn name(&self, name: &str) -> Option<&str> {
        let a = self.find(name)?;
        (a.kind == code::rig_arg::NAME).then(|| a.text.map(|t| self.f.name(t)))?
    }
}

type R<T> = Result<T, String>;

impl<'a> Flattener<'a> {
    pub fn new(bin: &'a SceneBin) -> Self {
        Self {
            bin,
            over: None,
            depth: 0,
            rig_out: Vec::new(),
        }
    }

    /// A flattener that applies what the timelines set.
    pub fn with(bin: &'a SceneBin, over: &'a Overrides) -> Self {
        Self {
            over: Some(over),
            ..Self::new(bin)
        }
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

    fn emit_prim(&mut self, prim: &Prim, t: &Transform, scope: &[f64], out: &mut Vec<Block>) {
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
            code::prim::RIG => {
                let mut blocks = std::mem::take(&mut self.rig_out);
                blocks.clear();
                {
                    let settings = RigSettings {
                        f: self,
                        args: &self.bin.rig_args[prim.rig_args.clone()],
                        scope,
                    };
                    rigs::draw(prim.rig, &settings, &mut blocks);
                }
                for mut b in blocks.drain(..) {
                    match b.kind {
                        BlockKind::Box => {
                            let (a, s) = place_box(t, b.a, b.b);
                            b.a = out3(a);
                            b.b = out3(s);
                        }
                        _ => {
                            b.a = out3(point(t, b.a));
                            if b.kind == BlockKind::Line {
                                b.b = out3(point(t, b.b));
                            }
                        }
                    }
                    // The rig's own layer (sparks: 1) sits on the prim's and the instance's.
                    if let Some(l) = layer {
                        b.layer = z(l + b.layer);
                    }
                    if prim.decor {
                        b.flags |= flags::DECOR;
                    }
                    b.tag = tag;
                    out.push(b);
                }
                self.rig_out = blocks;
            }
            // Sprites are v1.1.
            _ => {}
        }
    }

    /// The scope of a definition used by an instance: its param defaults, the instance's values,
    /// then what the timelines set.
    fn scope_of(&self, def: &Def, inst: usize, parent: &[f64]) -> Vec<f64> {
        let mut scope = self.scope_with(def, self.bin.instances[inst].args.clone(), parent);
        if let Some(over) = self.over {
            for (p, x) in scope.iter_mut().enumerate() {
                if let Some(v) = over.param(inst, p) {
                    *x = v;
                }
            }
        }
        scope
    }

    /// A definition's param defaults, then the values of `args` (evaluated in `parent`).
    fn scope_with(&self, def: &Def, args: Range<usize>, parent: &[f64]) -> Vec<f64> {
        let mut scope: Vec<f64> = self.bin.params[def.params.clone()]
            .iter()
            .map(|p| p.default)
            .collect();
        for a in &self.bin.args[args] {
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
            .ok_or_else(|| [self.name(d.name), ": no socket \"", name, "\""].concat())?;
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
            Slot::Busy => return Err([self.name(asm.name), ": snap cycle"].concat()),
            Slot::Todo => {}
        }
        slots[k] = Slot::Busy;
        let index = asm.instances.start + k;
        let inst = &self.bin.instances[index];
        let def = &self.bin.defs[inst.def];
        let inner = self.scope_of(def, index, scope);
        let mut t = Transform {
            s: self.over.and_then(|o| o.scale[index]).unwrap_or(inst.scale),
            turn: self.over.and_then(|o| o.turn[index]).unwrap_or(inst.turn),
            t: self
                .over
                .and_then(|o| o.at[index])
                .or_else(|| inst.at.map(|at| self.vec(at, scope))),
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
            let shown = match self.over.and_then(|o| o.visible[p.inst]) {
                Some(v) => v,
                None => inst.visible.as_ref().is_none_or(|v| self.flag(v, scope)),
            };
            if !shown {
                continue;
            }
            let world = compose(t, &p.t);
            let bin = self.bin;
            let d = &bin.defs[p.def];
            if d.kind == code::def::PART {
                for prim in &bin.prims[d.prims.clone()] {
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
        self.emit_assembly(self.bin.scene.root, vars, &t, out)?;
        // Conveyor copies, after the root (§2 `conveyor`, P3 notes).
        if let Some(over) = self.over {
            let bin = self.bin;
            for c in &over.copies {
                let track = &bin.tracks[c.track];
                let def = &bin.defs[track.def];
                let scope = self.scope_with(def, track.args.clone(), vars);
                let at = Transform {
                    t: Some(c.at),
                    ..IDENTITY
                };
                let world = compose(&t, &at);
                if def.kind == code::def::PART {
                    for prim in &bin.prims[def.prims.clone()] {
                        self.emit_prim(prim, &world, &scope, out);
                    }
                } else {
                    self.emit_assembly(track.def, &scope, &world, out)?;
                }
            }
        }
        Ok(())
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
