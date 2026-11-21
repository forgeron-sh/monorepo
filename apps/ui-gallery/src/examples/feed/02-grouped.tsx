import {
  Avatar,
  Feed,
  FeedContent,
  FeedGroup,
  FeedGroupLabel,
  FeedIndicator,
  FeedItem,
  FeedTime,
  FeedTitle,
} from "@forgeron/ui";

const days = [
  {
    label: "Today · Nov 18",
    events: [
      { id: "a", who: "Léa Martin", what: "deployed invoices-sync", at: "09:42" },
      { id: "b", who: "Hugo Bernard", what: "revoked a token", at: "08:03" },
    ],
  },
  {
    label: "Yesterday · Nov 17",
    events: [{ id: "c", who: "Camille Roy", what: "installed Notes", at: "17:20" }],
  },
];

export default function Grouped() {
  return (
    <div style={{ width: 360 }}>
      {days.map((day) => (
        <FeedGroup key={day.label}>
          <FeedGroupLabel>{day.label}</FeedGroupLabel>
          <Feed aria-label={day.label}>
            {day.events.map((event) => (
              <FeedItem key={event.id}>
                <FeedIndicator>
                  <Avatar name={event.who} size={18} />
                </FeedIndicator>
                <FeedContent>
                  <FeedTitle>
                    <b>{event.who}</b> {event.what}
                  </FeedTitle>
                  <FeedTime>{event.at}</FeedTime>
                </FeedContent>
              </FeedItem>
            ))}
          </Feed>
        </FeedGroup>
      ))}
    </div>
  );
}
