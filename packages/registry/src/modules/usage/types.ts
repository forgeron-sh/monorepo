/** Usage of a workspace over a period of UTC days (D-093). */
export interface UsageReport {
  from: string;
  to: string;
  /** Calls and distinct people per tool, most used first. */
  tools: Array<{ tool: string; calls: number; people: number }>;
  /** Calls per person, most active first. `name` and `email` are the member's, empty if the person left. */
  people: Array<{ person: string; name: string; email: string; calls: number }>;
}
