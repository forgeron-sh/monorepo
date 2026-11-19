// The calls of webhooks, newest first: status, event, answer code, duration and attempts on one
// row, and under a row (opened with its button) the payload that was sent and the answer, as
// JSON. A failed delivery can be sent again. The block only shows and calls back.

import { ArrowDown01Icon, ArrowRight01Icon, RefreshCwIcon } from "@forgeron/icons";
import { useId, useState } from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { Icon } from "../icon";
import { JsonView } from "./automation-json-view";
import {
  adminPlural,
  canRedeliver,
  DELIVERY_STATUS_NAMES,
  DELIVERY_TONES,
  deliveryCodeText,
  deliveryCounts,
  filterDeliveries,
  formatDeliveryDuration,
  type DeliveryFilter,
  type WebhookDelivery,
} from "./admin-model";

export interface DeliveryLogProps {
  deliveries: ReadonlyArray<WebhookDelivery>;
  /** The Redeliver button of a row. Without it there is none. */
  onRedeliver?: (id: string) => void;
  /** The ids of the deliveries being sent again. */
  redelivering?: ReadonlyArray<string>;
  /** Which rows: all, or those that failed. Controlled with `onFilterChange`, or left to the log. */
  filter?: DeliveryFilter;
  defaultFilter?: DeliveryFilter;
  onFilterChange?: (filter: DeliveryFilter) => void;
  /** Writes the URL on each row, for a log that covers several endpoints. */
  showUrl?: boolean;
  /** The ids of the rows that start open. */
  defaultOpen?: ReadonlyArray<string>;
  empty?: string;
  className?: string;
}

function Row({
  d,
  open,
  toggle,
  showUrl,
  onRedeliver,
  busy,
}: {
  d: WebhookDelivery;
  open: boolean;
  toggle: () => void;
  showUrl: boolean;
  onRedeliver: ((id: string) => void) | undefined;
  busy: boolean;
}) {
  const id = useId();
  return (
    <li className={cx("fg-adm-delivery", open && "fg-adm-delivery-open")}>
      <div className="fg-adm-delivery-row">
        <button
          type="button"
          className="fg-adm-delivery-toggle"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-label={`${d.event}, ${DELIVERY_STATUS_NAMES[d.status]}, ${d.at}`}
          onClick={toggle}
        >
          <Icon icon={open ? ArrowDown01Icon : ArrowRight01Icon} size={12} variant="mono" />
          <Badge tone={DELIVERY_TONES[d.status]} dot>
            {DELIVERY_STATUS_NAMES[d.status]}
          </Badge>
          <span className="fg-adm-delivery-event">{d.event}</span>
          {showUrl && d.url ? <span className="fg-adm-delivery-url">{d.url}</span> : null}
        </button>
        <span className="fg-adm-delivery-meta">
          <span className="fg-adm-delivery-code" title="Answer code">
            {deliveryCodeText(d)}
          </span>
          <span title="Duration">{formatDeliveryDuration(d.durationMs)}</span>
          <span title="Attempts">{adminPlural(d.attempts, "try", "tries")}</span>
          <time>{d.at}</time>
        </span>
        {onRedeliver && canRedeliver(d) ? (
          <Button
            size="sm"
            disabled={busy}
            aria-label={`Redeliver ${d.event} of ${d.at}`}
            onClick={() => onRedeliver(d.id)}
          >
            <Icon icon={RefreshCwIcon} size={12} variant="mono" />
            {busy ? "Sending…" : "Redeliver"}
          </Button>
        ) : null}
      </div>
      {open ? (
        <div id={`${id}-panel`} className="fg-adm-delivery-panel">
          <JsonView
            label="Payload sent"
            value={d.request}
            maxHeight={220}
            empty="No payload recorded"
          />
          <JsonView label="Answer" value={d.response} maxHeight={220} empty="No answer recorded" />
        </div>
      ) : null}
    </li>
  );
}

/** A log of webhook deliveries: filter, open a row for its payload and answer, redeliver. */
export function DeliveryLog({
  deliveries,
  onRedeliver,
  redelivering = [],
  filter,
  defaultFilter = "all",
  onFilterChange,
  showUrl = false,
  defaultOpen = [],
  empty = "No deliveries yet.",
  className,
}: DeliveryLogProps) {
  const [own, setOwn] = useState<DeliveryFilter>(defaultFilter);
  const current = filter ?? own;
  const [open, setOpen] = useState<ReadonlyArray<string>>(defaultOpen);
  const rows = filterDeliveries(deliveries, current);
  const counts = deliveryCounts(deliveries);
  const failed = counts.failed + counts.retrying;
  return (
    <section className={cx("fg-adm fg-adm-log", className)}>
      <div className="fg-adm-bar">
        <span className="fg-adm-count">
          {adminPlural(deliveries.length, "delivery", "deliveries")}
          {failed ? `, ${failed} failing` : ""}
        </span>
        <Segmented
          label="Show"
          options={[
            { value: "all", label: "All" },
            { value: "failed", label: `Failed${failed ? ` (${failed})` : ""}` },
          ]}
          value={current}
          onChange={(v) => {
            setOwn(v as DeliveryFilter);
            onFilterChange?.(v as DeliveryFilter);
          }}
        />
      </div>
      {rows.length === 0 ? (
        <p className="fg-adm-empty">{current === "failed" ? "Nothing failed." : empty}</p>
      ) : (
        <ul className="fg-adm-deliveries" aria-label="Deliveries">
          {rows.map((d) => (
            <Row
              key={d.id}
              d={d}
              open={open.includes(d.id)}
              toggle={() =>
                setOpen(open.includes(d.id) ? open.filter((x) => x !== d.id) : [...open, d.id])
              }
              showUrl={showUrl}
              onRedeliver={onRedeliver}
              busy={redelivering.includes(d.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
