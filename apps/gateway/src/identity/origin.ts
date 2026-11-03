// The rule of D-049 for a form post of the gateway's own pages: it comes from the page itself.
// A request from another origin is refused outright, so a third-party page cannot act for a
// signed-in person.

/** Whether a POST came from a page of this origin. */
export function sameOriginPost(request: Request): boolean {
  const origin = request.headers.get("origin");
  // `Sec-Fetch-Site` is set by the browser, never by a page: it covers a browser that sends no or a
  // null origin on a same-origin form post.
  const sameSite = request.headers.get("sec-fetch-site") === "same-origin";
  return (
    origin === new URL(request.url).origin || (sameSite && (origin === null || origin === "null"))
  );
}
