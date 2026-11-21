import {
  Feed,
  FeedContent,
  FeedDescription,
  FeedIndicator,
  FeedItem,
  FeedTime,
  FeedTitle,
} from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 360 }}>
      <Feed aria-label="History">
        <FeedItem>
          <FeedIndicator tone="success" />
          <FeedContent>
            <FeedTitle>
              <b>Léa Martin</b> approved the quote
            </FeedTitle>
            <FeedTime dateTime="2026-11-18T09:42">09:42</FeedTime>
            <FeedDescription>Margin is fine, send it.</FeedDescription>
          </FeedContent>
        </FeedItem>
        <FeedItem>
          <FeedIndicator tone="accent" />
          <FeedContent>
            <FeedTitle>
              <b>Camille Roy</b> asked for a review
            </FeedTitle>
            <FeedTime dateTime="2026-11-18T08:15">08:15</FeedTime>
          </FeedContent>
        </FeedItem>
        <FeedItem>
          <FeedIndicator />
          <FeedContent>
            <FeedTitle>
              <b>Camille Roy</b> created the quote
            </FeedTitle>
            <FeedTime dateTime="2026-11-17T16:30">Yesterday</FeedTime>
          </FeedContent>
        </FeedItem>
      </Feed>
    </div>
  );
}
