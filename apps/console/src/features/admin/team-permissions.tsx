import { holds, PLATFORM, type PlatformPermission } from "@forgeron/permissions";
import { Checkbox } from "@forgeron/ui";
import { HELD_HINT } from "../../team-picker";
import type { PermissionGroup } from "../../teams";

// What a team may do on Forgeron (D-136): one card per group of the catalog, a checkbox per
// permission with its sentence. Checking a write checks, and locks, the reads it implies. What the
// person who edits does not hold themselves cannot be given or taken away. The admin team holds every
// permission, now and to come: nothing to tick.

type Names = ReadonlySet<PlatformPermission>;

/** What these grants give: each one and what it implies, from the catalog the platform sent. */
function closure(
  groups: readonly PermissionGroup[],
  granted: Iterable<PlatformPermission>,
): Set<PlatformPermission> {
  const implies = new Map(groups.flatMap((g) => g.permissions.map((p) => [p.name, p.implies])));
  const held = new Set<PlatformPermission>();
  const pending = [...granted];
  while (pending.length > 0) {
    const next = pending.pop()!;
    if (held.has(next)) continue;
    held.add(next);
    pending.push(...(implies.get(next) ?? []));
  }
  return held;
}

/** The permissions a team was explicitly given, as the picker starts from them. */
export const explicitOf = (stored: readonly string[]): Set<PlatformPermission> =>
  new Set(stored.filter((p): p is PlatformPermission => p in PLATFORM.permissions));

export function TeamPermissions({
  groups,
  value,
  onChange,
  actor,
  readOnly,
  everything,
}: {
  groups: readonly PermissionGroup[];
  /** What was explicitly checked; what it implies is shown checked and locked. */
  value: Names;
  onChange: (next: Set<PlatformPermission>) => void;
  /** What the person who edits holds. */
  actor: readonly PlatformPermission[];
  readOnly: boolean;
  /** The admin team: `*`. */
  everything: boolean;
}) {
  if (everything) {
    return (
      <p className="fc-muted">
        Every permission, now and to come. It cannot be changed: this team always holds all of them.
      </p>
    );
  }
  const effective = closure(groups, value);
  // What the person who edits does not hold themselves: they may neither give nor take it away.
  const lacking = new Set(
    groups
      .flatMap((g) => g.permissions.map((p) => p.name))
      .filter((n) => !holds(PLATFORM, actor, n)),
  );
  return (
    <div className="fc-perm-cards">
      {groups.map((group) => (
        <section key={group.label} className="fc-panel fc-perm-card" aria-label={group.label}>
          <h3 className="fc-section-title">{group.label}</h3>
          <div className="fc-checks fc-perm-list">
            {group.permissions.map((p) => {
              // Locked by another checked permission that gives it.
              const giver = [...value].find(
                (q) => q !== p.name && closure(groups, [q]).has(p.name),
              );
              const cannot = lacking.has(p.name);
              const note = giver
                ? `Included in ${labelOf(groups, giver)}`
                : cannot
                  ? HELD_HINT
                  : undefined;
              return (
                <span key={p.name} title={cannot && !giver ? HELD_HINT : undefined}>
                  <Checkbox
                    label={
                      <>
                        <strong>{p.label}</strong> <span className="fc-muted">{p.description}</span>
                        {note ? <span className="fc-muted"> · {note}</span> : null}
                      </>
                    }
                    checked={effective.has(p.name)}
                    disabled={readOnly || cannot || giver !== undefined}
                    onChange={(e) => {
                      const next = new Set(value);
                      if (e.target.checked) next.add(p.name);
                      else next.delete(p.name);
                      onChange(next);
                    }}
                  />
                </span>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const labelOf = (groups: readonly PermissionGroup[], name: PlatformPermission) =>
  groups.flatMap((g) => g.permissions).find((p) => p.name === name)?.label ?? name;
