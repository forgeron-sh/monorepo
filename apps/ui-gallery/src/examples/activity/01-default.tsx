// Composed from parts: a header, the list of entries (events and comments are their own parts), and
// the comment composer, whose box and button are parts too.
import {
  Activity,
  ActivityCommentBody,
  ActivityCommentHeader,
  ActivityCommentItem,
  ActivityEventItem,
  ActivityHeader,
  ActivityList,
  ActivityTitle,
  Button,
  CommentComposer,
  CommentComposerFooter,
  CommentComposerInput,
  CommentComposerSubmit,
  StatusGlyph,
  type ActivityComment,
  type ActivityEvent,
} from "@forgeron/ui";
import { useState } from "react";

const events: ActivityEvent[] = [
  { kind: "event", id: "e1", author: "Camille Roy", text: "created the issue", time: "3 Nov" },
  {
    kind: "event",
    id: "e2",
    author: "Hugo Bernard",
    text: "moved it to In Review",
    time: "2 h ago",
    glyph: <StatusGlyph status="review" />,
  },
];
const first: ActivityComment = {
  kind: "comment",
  id: "c1",
  author: "Nadia Petit",
  body: "Thanks. Two suppliers called about it this morning.",
  time: "1 h ago",
};

export default function Composed() {
  const [sent, setSent] = useState<ActivityComment[]>([]);
  return (
    <div style={{ width: 360 }}>
      <Activity>
        <ActivityHeader>
          <ActivityTitle>Activity</ActivityTitle>
          <Button size="sm">Subscribe</Button>
        </ActivityHeader>
        <ActivityList>
          {events.map((event) => (
            <ActivityEventItem key={event.id} item={event} />
          ))}
          {[first, ...sent].map((comment) => (
            <ActivityCommentItem key={comment.id} item={comment}>
              <ActivityCommentHeader />
              <ActivityCommentBody />
            </ActivityCommentItem>
          ))}
        </ActivityList>
        <CommentComposer
          submitLabel="Reply"
          onSubmit={(body) =>
            setSent((all) => [
              ...all,
              { kind: "comment", id: `s${all.length}`, author: "You", body, time: "just now" },
            ])
          }
        >
          <CommentComposerInput />
          <CommentComposerFooter>
            <CommentComposerSubmit />
          </CommentComposerFooter>
        </CommentComposer>
      </Activity>
    </div>
  );
}
