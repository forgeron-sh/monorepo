import { Button, Notice, Skeleton, SkeletonGroup, SkeletonText } from "@forgeron/ui";
import { explain } from "./api";

/** The shape of what a screen is about to show, so the page does not jump when it arrives. */
export type LoadingShape = "page" | "list" | "table" | "cards" | "form" | "block";

const ROWS = [0, 1, 2, 3, 4];
const CARDS = [0, 1, 2, 3, 4, 5];

function Shape({ shape }: { shape: LoadingShape }) {
  switch (shape) {
    case "list":
      return (
        <>
          {ROWS.slice(0, 4).map((i) => (
            <div key={i} className="fc-skeleton-row">
              <Skeleton width="32%" />
              <Skeleton width="48%" />
            </div>
          ))}
        </>
      );
    case "table":
      return (
        <div className="fc-skeleton-table">
          <Skeleton height={32} />
          {ROWS.map((i) => (
            <div key={i} className="fc-skeleton-cells">
              <Skeleton width="70%" />
              <Skeleton width="50%" />
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </div>
          ))}
        </div>
      );
    case "cards":
      return (
        <div className="fc-skeleton-cards">
          {CARDS.map((i) => (
            <div key={i} className="fc-skeleton-card">
              <Skeleton width={40} height={40} />
              <Skeleton width="55%" height={16} />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      );
    case "form":
      return (
        <div className="fc-skeleton-form">
          {[0, 1, 2].map((i) => (
            <div key={i} className="fc-skeleton-field">
              <Skeleton width={120} height={12} />
              <Skeleton height={32} />
            </div>
          ))}
          <Skeleton width={96} height={32} />
        </div>
      );
    case "block":
      return (
        <>
          <Skeleton width="40%" height={20} />
          <SkeletonText lines={4} />
        </>
      );
    default:
      return (
        <>
          <Skeleton width="30%" height={24} />
          <SkeletonText lines={2} />
          <div className="fc-skeleton-table">
            {ROWS.slice(0, 3).map((i) => (
              <Skeleton key={i} height={48} />
            ))}
          </div>
        </>
      );
  }
}

/** The loading state of a screen: grey shapes where the content will be, one word for assistive technology. */
export function Loading({ label, shape = "page" }: { label: string; shape?: LoadingShape }) {
  return (
    <SkeletonGroup label={label} className="fc-loading">
      <Shape shape={shape} />
    </SkeletonGroup>
  );
}

/** The error state of a screen: what happened, then what to do. */
export function LoadError({
  what,
  error,
  onRetry,
}: {
  what: string;
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <Notice
      tone="danger"
      title={`${what} could not be loaded.`}
      action={
        onRetry ? (
          <Button size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    >
      {explain(error, "Check your connection, then try again.")}
    </Notice>
  );
}

/** A screen only admins may use; the platform refuses anyone else, this says so first. */
export function AdminOnly({ what }: { what: string }) {
  return (
    <Notice tone="info" title={`${what} is for admins.`}>
      Ask an admin of this workspace to give you the admin role.
    </Notice>
  );
}
