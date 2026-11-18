//! State machines (docs/blueprint/engine.md §2, `StateMachine`): each frame, the first
//! transition of a machine whose `from` matches (its current state, or `*` for any other) and
//! whose condition holds is taken, one per machine per frame. Entering a state starts the clock
//! of the timelines it plays; its `set` values hold while it is current, under the host's.

use crate::bin::SceneBin;
use crate::layout::code;

/// What happened since the last frame: events queued by the host (string indices) and the
/// hovered tag's change (the engine's own `hover:<tag>` and `leave`).
#[derive(Clone, Debug, Default)]
pub struct Events {
    pub queued: Vec<usize>,
    /// The tag now hovered (its name) when it changed to a tag.
    pub hover: Option<String>,
    /// The pointer left a tag.
    pub leave: bool,
}

impl Events {
    fn has(&self, bin: &SceneBin, event: usize) -> bool {
        if self.queued.contains(&event) {
            return true;
        }
        let name = &bin.strings[event];
        if self.leave && name == "leave" {
            return true;
        }
        match (&self.hover, name.strip_prefix("hover:")) {
            (Some(tag), Some(want)) => tag == want,
            _ => false,
        }
    }

    pub fn clear(&mut self) {
        self.queued.clear();
        self.hover = None;
        self.leave = false;
    }
}

#[derive(Clone, Debug, Default)]
pub struct Machines {
    /// Each machine's current state, as an index into `bin.states`.
    pub current: Vec<usize>,
    /// When it was entered (the time input).
    pub entered: Vec<f64>,
}

impl Machines {
    pub fn new(bin: &SceneBin) -> Self {
        Self {
            current: bin
                .machines
                .iter()
                .map(|m| m.states.start + m.initial)
                .collect(),
            entered: vec![0.0; bin.machines.len()],
        }
    }

    /// Takes at most one transition per machine; true when a machine changed state.
    pub fn step(&mut self, bin: &SceneBin, scope: &[f64], time: f64, events: &Events) -> bool {
        let mut changed = false;
        for (m, machine) in bin.machines.iter().enumerate() {
            let here = self.current[m] - machine.states.start;
            for x in &bin.transitions[machine.transitions.clone()] {
                let from_ok = match x.from {
                    Some(f) => f == here,
                    None => x.to != here,
                };
                if !from_ok {
                    continue;
                }
                let v = |slot: usize| scope.get(slot).copied().unwrap_or(f64::NAN);
                let holds = match x.when {
                    code::when::RANGE => v(x.slot) >= x.lo && v(x.slot) < x.hi,
                    code::when::EQUALS => v(x.slot) == x.value,
                    code::when::AFTER => time - self.entered[m] >= x.after,
                    code::when::EVENT => events.has(bin, x.event),
                    _ => false,
                };
                if holds {
                    self.current[m] = machine.states.start + x.to;
                    self.entered[m] = time;
                    changed = true;
                    break;
                }
            }
        }
        changed
    }

    /// The current states' `set` values, where the host set nothing.
    pub fn apply_sets(&self, bin: &SceneBin, host: &[f64], scope: &mut [f64]) {
        for &s in &self.current {
            for &(slot, value) in &bin.sets[bin.states[s].sets.clone()] {
                if host.get(slot).is_none_or(|h| h.is_nan()) {
                    if let Some(x) = scope.get_mut(slot) {
                        *x = value;
                    }
                }
            }
        }
    }

    /// When timeline `timeline` plays in a current state: the time that state was entered.
    pub fn playing(&self, bin: &SceneBin, timeline: usize) -> Option<f64> {
        self.current.iter().enumerate().find_map(|(m, &s)| {
            bin.plays[bin.states[s].plays.clone()]
                .contains(&timeline)
                .then_some(self.entered[m])
        })
    }
}
