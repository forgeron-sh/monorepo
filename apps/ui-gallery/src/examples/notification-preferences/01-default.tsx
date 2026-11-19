import {
  NotificationPreferences,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationPrefs,
} from "@forgeron/ui";
import { useState } from "react";

const events: NotificationEvent[] = [
  {
    id: "mention",
    group: "Activity",
    label: "Someone mentions you",
    description: "In a comment or a message.",
  },
  { id: "assign", group: "Activity", label: "Something is assigned to you" },
  { id: "due", group: "Activity", label: "A due date is close" },
  { id: "invoice-paid", group: "Billing", label: "An invoice is paid" },
  {
    id: "invoice-late",
    group: "Billing",
    label: "An invoice is late",
    description: "Once a day at most.",
  },
  { id: "sign-in", group: "Security", label: "A new device signs in" },
];

const channels: NotificationChannel[] = [
  { id: "email", label: "Email" },
  { id: "push", label: "Push" },
  { id: "chat", label: "Chat" },
  { id: "sms", label: "SMS", unavailable: true },
];

const defaults: NotificationPrefs = {
  channels: {
    mention: ["email", "push"],
    assign: ["email"],
    "invoice-paid": ["email"],
    "sign-in": ["email", "push"],
  },
  digest: "daily",
  quiet: { enabled: false, from: "22:00", to: "07:00" },
};

export default function Default() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaults);
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <NotificationPreferences
        label="Notification preferences"
        events={events}
        channels={channels}
        value={prefs}
        onChange={setPrefs}
        defaults={defaults}
      />
    </div>
  );
}
