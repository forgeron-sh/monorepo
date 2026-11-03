import { Button, Notice, Spinner } from "@forgeron/ui";
import { explain } from "./api";

/** The loading state of a screen. */
export function Loading({ label }: { label: string }) {
  return (
    <div className="fc-loading">
      <Spinner label={label} />
    </div>
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
