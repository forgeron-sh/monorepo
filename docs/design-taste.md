# What we like and what we don't, in the Forgeron design language

The lab language (pixel, dither, ember accent, hatched rails) is the source of truth of the design system. This page records the owner's reactions to the first sites built with it (the landing, the icon gallery, the font specimen), as **before → after** pairs, so that the next page, icon or component starts from them instead of rediscovering them.

Each line is a stated preference, not a guess. When a rule and a rendered result disagree, the rendered result decides: look at it before you defend the rule.

## Layout and structure

| Before                                                                        | After                                                                                                                                                             | Why                                                             |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Large section titles with a big `/0.x` index on every section                 | Only the small hatched spacer band that announces a section ("/0.x → Name"), closed by a line above and below                                                     | Big titles weigh the page down. The band is enough to navigate. |
| A spacer band with a bottom border only                                       | A top separator as well                                                                                                                                           | A band must read as a closed strip.                             |
| Plain bordered cards                                                          | Bordered containers glued to each other, corner brackets a little bolder than the 1 px line, hatched stripes in the empty spaces, copied exactly from the landing | One recognisable frame across every site, not an approximation. |
| Controls of different heights on one row (swatches, toggles, selects)         | One control height on any horizontal row, one token for it                                                                                                        | Mixed heights look broken.                                      |
| A tester, a download block and the whole licence on the home page             | A light home page. The playground is its own page, downloads and licence detail live in modals                                                                    | The home presents. It does not host tools or walls of text.     |
| Counters and stats in chrome ("35 / 6,121 drawn", "v0.1 · OTF", glyph counts) | Removed                                                                                                                                                           | Numbers in the navbar and in lists are noise.                   |

## Copy and density

| Before                                                                     | After                                                                                           |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Paragraphs of explanation under every section                              | Short, scannable lines                                                                          |
| Notes that need prose                                                      | Small labelled chunks, one line each, with a pixel icon, or a modal for the detail that matters |
| Taglines and captions ("A pixel typeface on a 5-pixel grid", "FIG.02 · …") | Removed                                                                                         |
| Callouts, leader lines and measurement labels over a drawing               | Removed. The drawing stands alone, with room above and below, and without corner crosses        |
| Several calls to action in the hero                                        | One, or none: the navbar carries the actions                                                    |

Minimal first: if a line does not help someone choose or act, cut it.

## Colour and buttons

| Before                                       | After                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| White text on the orange button was tried    | Black text on orange (`--accent-ink`), as on the landing. White was reverted   |
| Possible second oranges (hex, mixed opacity) | One orange, the `--accent` token, everywhere. The same one as the navbar label |

## Motion

| Before                                | After                                                                                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A typing or writing effect on a title | A fast, pixel-crisp dither reveal (about 1.3 to 1.8 s for a hero title): a Bayer-thresholded front scans the pixel rows, left to right inside each row, with palette steps at the front and a small corruption wave that resolves into clean text |
| Blur and opacity fades                | Never: pixels switch on or off whole                                                                                                                                                                                                              |

Always: static final text under `prefers-reduced-motion`, text available to screen readers from the start, no drawing while off-screen.

## Pixel icons

| Before                                                         | After                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stroke vectors mixed with pixel icons in one set               | Everything is pixel art on the 12-pixel grid, duotone (16 only for brand marks). The stroke style was removed                                                                                                                                             |
| A settings icon "like a final boss": heavy, blobby, many teeth | A light cog: thin rim, big hub hole, eight one-pixel teeth, readable at 16 px                                                                                                                                                                             |
| A generic cloud for the Cloudflare mark                        | A faithful pixel rendition of the real mark, checked side by side with the reference                                                                                                                                                                      |
| Long unbroken straight lines                                   | Short runs and clear proportions between stroke, gap and size                                                                                                                                                                                             |
| A symbol half a pixel off centre (a one-pixel "i" in a ring)   | Centred exactly: even widths for a centred symbol, or a drawing symmetric by a half turn                                                                                                                                                                  |
| Monotone almost everywhere                                     | The secondary tone on the one part that carries the idea (the arrow of `upload-01`, the head of `user`, the dot of `wifi-01`, the cross of `cancel-circle`), and none where nothing stands out (`more-horizontal`, `moon-02`, `minus-sign`, `message-01`) |
| Outline only                                                   | A filled variant where the shape is closed, as its own icon named `<name>-fill`: the shape filled, the inner symbol cut out                                                                                                                               |

The success criterion is that the icon looks right at 16, 24 and 48 px, not that it follows the recipe. The full protocol and the checklist are in [`icons.md`](icons.md).

## How to use this page

1. Before building a page or a component, read the "After" column of the matching table.
2. When the owner reacts to a rendered result, add the pair here (before, after, why) in the same change that fixes it.
3. Keep entries factual. Do not add a preference nobody stated.
