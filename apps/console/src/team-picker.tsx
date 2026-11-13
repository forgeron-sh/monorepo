import { missingToGrant, PLATFORM } from "@forgeron/permissions";
import { Checkbox } from "@forgeron/ui";
import type { PlatformPermission } from "@forgeron/permissions";
import { teamSummary, type TeamRow } from "./teams";

// A multi-select of teams, built-ins first (the list comes sorted): a checkbox per team with what it
// may do. A person may only put someone in a team whose permissions they hold themselves (D-136): the
// others are disabled with the reason.

export const HELD_HINT = "You can only give what you hold";

/** Whether `actor` holds every permission `team` gives: the rule against escalation. */
const mayGive = (actor: readonly PlatformPermission[], team: Pick<TeamRow, "effective">) =>
  missingToGrant(PLATFORM, actor, team.effective).length === 0;

export function TeamPicker({
  teams,
  value,
  onChange,
  actor,
  legend = "Teams",
  hint,
  hide = [],
  disabled = false,
}: {
  teams: readonly TeamRow[];
  value: readonly string[];
  onChange: (teams: string[]) => void;
  /** What the person who changes it holds. */
  actor: readonly PlatformPermission[];
  legend?: string;
  hint?: string;
  /** Team ids that are not offered. */
  hide?: readonly string[];
  disabled?: boolean;
}) {
  const offered = teams.filter((t) => !hide.includes(t.id));
  return (
    <fieldset className="fc-fieldset">
      <legend className="fc-legend">{legend}</legend>
      {hint ? <p className="fc-muted">{hint}</p> : null}
      {offered.length === 0 ? (
        <p className="fc-muted">No team yet. Create one in Teams.</p>
      ) : (
        <div className="fc-checks">
          {offered.map((team) => {
            const allowed = mayGive(actor, team);
            return (
              <span key={team.id} title={allowed ? undefined : HELD_HINT}>
                <Checkbox
                  label={
                    <>
                      {team.name} <span className="fc-muted">{teamSummary(team)}</span>
                      {allowed ? null : <span className="fc-muted"> · {HELD_HINT}</span>}
                    </>
                  }
                  checked={value.includes(team.id)}
                  disabled={disabled || !allowed}
                  onChange={(e) =>
                    onChange(
                      e.target.checked ? [...value, team.id] : value.filter((t) => t !== team.id),
                    )
                  }
                />
              </span>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
