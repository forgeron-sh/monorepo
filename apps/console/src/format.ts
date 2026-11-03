const DAY = 24 * 60 * 60 * 1000;

/** `Expires in 13 days`, `Expires today`, `Expired`. */
export function expiry(iso: string, now: Date): { text: string; expired: boolean } {
  const left = new Date(iso).getTime() - now.getTime();
  if (Number.isNaN(left)) return { text: "No expiry date", expired: false };
  if (left <= 0) return { text: "Expired", expired: true };
  const days = Math.floor(left / DAY);
  if (days === 0) return { text: "Expires today", expired: false };
  return { text: `Expires in ${days} ${days === 1 ? "day" : "days"}`, expired: false };
}

/** `just now`, `5 minutes ago`, `3 hours ago`, `2 days ago`, else the date. */
export function ago(iso: string, now: Date): string {
  const past = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(past)) return iso;
  const minutes = Math.floor(past / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 8) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return iso.slice(0, 10);
}
