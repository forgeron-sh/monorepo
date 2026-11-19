// What someone is told, and how: events down the side, channels across the top, a checkbox where
// they meet, a switch per channel and per group to turn a whole column of a group on or off, a
// digest frequency, quiet hours, and a way back to the defaults. The checkboxes are native, so
// the keyboard and screen readers get them as they are.

import { useId } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Switch, Segmented } from "../controls";
import { useControllableState } from "../hooks/use-controllable";
import { TimePicker } from "../time";
import {
  channelCoverage,
  DIGEST_FREQUENCIES,
  DIGEST_NAMES,
  groupEvents,
  isChannelOn,
  quietHoursText,
  samePrefs,
  setChannel,
  setChannelForEvents,
  type DigestFrequency,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationPrefs,
} from "./admin-model";

export interface NotificationPreferencesProps {
  /** Names the matrix for assistive technology: "Notification preferences". */
  label: string;
  events: ReadonlyArray<NotificationEvent>;
  channels: ReadonlyArray<NotificationChannel>;
  value?: NotificationPrefs;
  defaultValue?: NotificationPrefs;
  onChange?: (value: NotificationPrefs) => void;
  /** What "Reset to default" goes back to. Without it the button is not shown. */
  defaults?: NotificationPrefs;
  /** The digest: a summary of what was held back, sent on this rhythm. Not shown when `false`. */
  digest?: boolean;
  /** Quiet hours: no notification between two times. Not shown when `false`. */
  quietHours?: boolean;
  /** Which words the digest frequencies are written in. */
  digestNames?: Partial<Record<DigestFrequency, string>>;
  disabled?: boolean;
  className?: string;
}

const NONE: NotificationPrefs = {
  channels: {},
  digest: "off",
  quiet: { enabled: false, from: "22:00", to: "07:00" },
};

/** Events by channels, with a switch per group and channel, a digest, quiet hours and a reset. */
export function NotificationPreferences({
  label,
  events,
  channels,
  value,
  defaultValue = NONE,
  onChange,
  defaults,
  digest = true,
  quietHours = true,
  digestNames,
  disabled = false,
  className,
}: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useControllableState<NotificationPrefs>({
    value,
    defaultValue,
    onChange,
  });
  const id = useId();
  const groups = groupEvents(events);
  const names = { ...DIGEST_NAMES, ...digestNames };
  const atDefault = defaults ? samePrefs(prefs, defaults) : true;

  return (
    <div className={cx("fg-adm fg-adm-np", className)}>
      <table className="fg-adm-np-table" aria-label={label}>
        <thead>
          <tr>
            <th scope="col" className="fg-adm-np-event">
              Event
            </th>
            {channels.map((c) => (
              <th key={c.id} scope="col" className="fg-adm-np-channel">
                {c.label}
                {c.unavailable ? <span className="fg-adm-np-off"> not set up</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map(({ group, events: list }) => {
          const ids = list.map((e) => e.id);
          return (
            <tbody key={group ?? "_"}>
              {group ? (
                <tr className="fg-adm-np-grouprow">
                  <th scope="rowgroup" className="fg-adm-np-groupname">
                    {group}
                  </th>
                  {channels.map((c) => {
                    const coverage = channelCoverage(prefs, ids, c.id);
                    return (
                      <td key={c.id} className="fg-adm-np-cell">
                        <Switch
                          checked={coverage === "all"}
                          disabled={disabled || c.unavailable}
                          label={
                            <>
                              <span className="fg-sr">
                                {c.label} for all of {group}
                              </span>
                              <span aria-hidden="true" className="fg-adm-np-cov">
                                {coverage === "all" ? "All" : coverage === "some" ? "Some" : "None"}
                              </span>
                            </>
                          }
                          onChange={(e) =>
                            setPrefs(setChannelForEvents(prefs, ids, c.id, e.currentTarget.checked))
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ) : null}
              {list.map((event) => (
                <tr key={event.id} className="fg-adm-np-row">
                  <th scope="row" className="fg-adm-np-event">
                    <span className="fg-adm-np-label">{event.label}</span>
                    {event.description ? (
                      <span className="fg-adm-np-desc">{event.description}</span>
                    ) : null}
                  </th>
                  {channels.map((c) => (
                    <td key={c.id} className="fg-adm-np-cell">
                      <input
                        type="checkbox"
                        className="fg-check-input"
                        aria-label={`${c.label}: ${event.label}`}
                        checked={isChannelOn(prefs, event.id, c.id)}
                        disabled={disabled || c.unavailable}
                        onChange={(e) =>
                          setPrefs(setChannel(prefs, event.id, c.id, e.currentTarget.checked))
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>

      {digest || quietHours ? (
        <div className="fg-adm-np-extras">
          {digest ? (
            <div className="fg-adm-np-block">
              <span id={`${id}-digest`} className="fg-adm-np-title">
                Digest
              </span>
              <span className="fg-adm-np-desc">One message that gathers what is not urgent.</span>
              <Segmented
                label="Digest frequency"
                options={DIGEST_FREQUENCIES.map((f) => ({ value: f, label: names[f] }))}
                value={prefs.digest}
                onChange={(v) => !disabled && setPrefs({ ...prefs, digest: v as DigestFrequency })}
              />
            </div>
          ) : null}
          {quietHours ? (
            <div className="fg-adm-np-block">
              <span className="fg-adm-np-title">Quiet hours</span>
              <span className="fg-adm-np-desc">
                {prefs.quiet.enabled
                  ? `Nothing is sent from ${quietHoursText(prefs.quiet)}.`
                  : "Nothing is held back."}
              </span>
              <Switch
                label="Hold notifications during quiet hours"
                checked={prefs.quiet.enabled}
                disabled={disabled}
                onChange={(e) =>
                  setPrefs({
                    ...prefs,
                    quiet: { ...prefs.quiet, enabled: e.currentTarget.checked },
                  })
                }
              />
              <div className="fg-adm-np-times">
                <TimePicker
                  label="Quiet hours start"
                  value={prefs.quiet.from}
                  disabled={disabled || !prefs.quiet.enabled}
                  onChange={(t) => t && setPrefs({ ...prefs, quiet: { ...prefs.quiet, from: t } })}
                />
                <span aria-hidden="true">to</span>
                <TimePicker
                  label="Quiet hours end"
                  value={prefs.quiet.to}
                  disabled={disabled || !prefs.quiet.enabled}
                  onChange={(t) => t && setPrefs({ ...prefs, quiet: { ...prefs.quiet, to: t } })}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {defaults ? (
        <div className="fg-adm-np-foot">
          <Button disabled={disabled || atDefault} onClick={() => setPrefs(defaults)}>
            Reset to default
          </Button>
        </div>
      ) : null}
    </div>
  );
}
