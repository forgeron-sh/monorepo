// Webhook endpoints: the URL, the events it listens to, its status, an enable switch, a test
// button, and its signing secret behind a SecretField. The block sends nothing: the buttons call
// back, and the app says what came of a test in `testResults`.

import { Badge } from "../badge";
import { defineStatuses } from "../status-model";
import { Button } from "../button";
import { Switch } from "../controls";
import { cx } from "../cx";
import {
  ENDPOINT_STATUS_NAMES,
  formatAdminDate,
  relativeDay,
  visibleEvents,
  type WebhookEndpoint,
} from "./admin-model";
import { SecretField } from "../secret-field";

export interface EndpointTestResult {
  ok: boolean;
  /** The HTTP status code of the answer. */
  code?: number;
  /** What went wrong, when it did: "Timed out after 10 s". */
  message?: string;
  /** When the test ran: `YYYY-MM-DD HH:MM`. */
  at?: string;
}

export interface EndpointListProps {
  endpoints: ReadonlyArray<WebhookEndpoint>;
  /** The switch of an endpoint. Without it the endpoint cannot be turned on or off here. */
  onToggle?: (id: string, enabled: boolean) => void;
  /** The Test button: send a sample event. Without it there is no button. */
  onTest?: (id: string) => void;
  /** The ids of the endpoints whose test is on its way. */
  testing?: ReadonlyArray<string>;
  /** How the last test of each endpoint went, by id. */
  testResults?: Readonly<Record<string, EndpointTestResult>>;
  /** The "Deliveries" button: open the log of this endpoint. */
  onSelect?: (id: string) => void;
  /** Reads the signing secret on demand (reveal, copy). */
  getSecret?: (id: string) => string | Promise<string>;
  /** Sends a new signing secret. Without it the secret cannot be replaced here. */
  onReplaceSecret?: (id: string, value: string) => void | Promise<void>;
  /** Today, `YYYY-MM-DD`: dates are told from it. */
  today?: string;
  /** Shown when there is no endpoint. */
  empty?: string;
  className?: string;
}

const ENDPOINT_STATUS = defineStatuses({
  active: { label: ENDPOINT_STATUS_NAMES.active, tone: "success" },
  disabled: { label: ENDPOINT_STATUS_NAMES.disabled, tone: "neutral" },
  failing: { label: ENDPOINT_STATUS_NAMES.failing, tone: "danger" },
});

/** The webhook endpoints of a workspace, each with its events, switch, test and secret. */
export function EndpointList({
  endpoints,
  onToggle,
  onTest,
  testing = [],
  testResults = {},
  onSelect,
  getSecret,
  onReplaceSecret,
  today,
  empty = "No endpoints yet.",
  className,
}: EndpointListProps) {
  if (endpoints.length === 0)
    return <p className={cx("fg-adm fg-adm-empty", className)}>{empty}</p>;
  return (
    <ul className={cx("fg-adm fg-adm-endpoints", className)} aria-label="Webhook endpoints">
      {endpoints.map((e) => {
        const { shown, more } = visibleEvents(e.events, 4);
        const result = testResults[e.id];
        const busy = testing.includes(e.id);
        return (
          <li key={e.id} className="fg-adm-endpoint">
            <div className="fg-adm-endpoint-head">
              <code className="fg-adm-endpoint-url" title={e.url}>
                {e.url}
              </code>
              <Badge tone={ENDPOINT_STATUS.tone(e.status)} dot>
                {ENDPOINT_STATUS.label(e.status)}
              </Badge>
            </div>
            {e.description ? <p className="fg-adm-endpoint-desc">{e.description}</p> : null}
            <div className="fg-adm-chips" aria-label="Events">
              {shown.length === 0 ? <span className="fg-adm-mono-dim">No events</span> : null}
              {shown.map((ev) => (
                <Badge key={ev} mono>
                  {ev}
                </Badge>
              ))}
              {more ? (
                <span title={e.events.slice(4).join(", ")}>
                  <Badge>+{more}</Badge>
                </span>
              ) : null}
            </div>
            {e.lastDeliveryAt ? (
              <p className="fg-adm-endpoint-last">
                Last delivery{" "}
                {today ? relativeDay(e.lastDeliveryAt, today) : formatAdminDate(e.lastDeliveryAt)}
              </p>
            ) : null}
            {e.secret ? (
              <SecretField
                label="Signing secret"
                isSet={e.secret.isSet}
                {...(e.secret.rotatedAt ? { rotatedAt: e.secret.rotatedAt } : {})}
                {...(today ? { today } : {})}
                {...(getSecret ? { getValue: () => getSecret(e.id) } : {})}
                {...(onReplaceSecret ? { onReplace: (v: string) => onReplaceSecret(e.id, v) } : {})}
              />
            ) : null}
            <div className="fg-adm-endpoint-foot">
              {onToggle ? (
                <Switch
                  label={`${e.name ?? e.url} enabled`}
                  checked={e.status !== "disabled"}
                  onChange={(ev) => onToggle(e.id, ev.currentTarget.checked)}
                />
              ) : null}
              <span className="fg-adm-spacer" />
              {result ? (
                <span
                  className={cx("fg-adm-test", result.ok ? "fg-adm-test-ok" : "fg-adm-test-fail")}
                  role="status"
                >
                  {result.ok ? "Test passed" : "Test failed"}
                  {result.code !== undefined ? ` · ${result.code}` : ""}
                  {result.message ? ` · ${result.message}` : ""}
                </span>
              ) : null}
              {onSelect ? (
                <Button size="sm" onClick={() => onSelect(e.id)}>
                  Deliveries
                </Button>
              ) : null}
              {onTest ? (
                <Button
                  size="sm"
                  disabled={busy}
                  aria-label={`Send a test event to ${e.url}`}
                  onClick={() => onTest(e.id)}
                >
                  {busy ? "Testing…" : "Test"}
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
