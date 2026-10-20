# Choreboard design

Choreboard should feel cheeky, fair and warm. References: Strava (monthly leaderboards,
kudos) with purple in place of orange, and Zuriga (zuriga.com) for restraint: white
space, one typeface, quiet grey panels, very little chrome.

The one loud thing is the leaderboard: a full-width purple slab with big scores, and the
forfeit hanging under it as a peach ticket stub. Everything around it stays white and
quiet.

## Colour

All colours live as semantic tokens in `src/app/globals.css`, defined once for light and
once for dark. Components use the tokens (`bg-surface`, `text-muted`), never palette
colours.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#ffffff` | `#121014` | Page |
| `surface` | `#f4f3f6` | `#1c1a20` | Inputs, secondary buttons, quiet panels |
| `foreground` | `#0f0d12` | `#f4f2f7` | Text |
| `muted` | `#6b6772` | `#a5a0ad` | Secondary text |
| `border` | `#e6e4ea` | `#2c2931` | Hairlines |
| `accent` | `#6a22c9` | `#a774f0` | Kudos purple: primary buttons, the logo |
| `accent-foreground` | `#ffffff` | `#160f20` | Text on accent |
| `accent-soft` | `#efe6fb` | `#2b2139` | Kudos tag, invite prompt |
| `accent-ink` | `#6a22c9` | `#c4a3f6` | Purple text on the page (points, kudos) |
| `board` | `#6a22c9` | `#3b1676` | The leaderboard slab |
| `board-foreground` | `#ffffff` | `#ffffff` | Text on the slab |
| `board-muted` | white 72% | white 66% | Ranks, dates on the slab |
| `stub` / `stub-foreground` | `#ffd9c7` / `#3a1d10` | `#f2c3ad` / `#2b140a` | The forfeit ticket |
| `danger` / `success` | `#b42318` / `#1f7a4d` | `#f97066` / `#4ade80` | Errors / confirmations |

Purple means credit: points, kudos, the button that logs a chore. Peach only ever means
the forfeit. No gradients, no other colours.

## Type

One family: Familjen Grotesk (Google Fonts via `next/font`, no new dependency).

- Regular (400) for body, medium (500) for names, labels and buttons, semibold (600) for
  headlines and scores. Nothing heavier.
- Scale: 14 / 16 / 20 / 30 / 42 px, 56 px for the landing headline on desktop. Tight
  tracking (-0.03em) on anything 30 px and up.
- Numbers use `tabular-nums` so scores line up. No monospace face, including the invite
  code (wide tracking instead).
- Sentence case everywhere. No all-caps labels.

## Components

- Header: purple tick-in-a-circle and the lowercase wordmark `choreboard` on the left, one
  text action on the right (`Log in` or `Log out`). White, hairline bottom border.
- Leaderboard slab: flat name and "October, 11 days left" on top, then one row per
  flatmate: small rank, name at 20 px, score at 40 px for the leader and 30 px for the
  rest. The lowest score gets a translucent "on forfeit watch" tag. Edge to edge on
  phones, rounded 16 px from `sm` up.
- Forfeit stub: peach strip under the slab with a scalloped top edge, one plain sentence.
- Buttons: primary is solid accent, 48 px tall, 6 px radius, medium weight. Secondary is
  `surface` fill with foreground text. One primary button per screen area.
- Inputs: `surface` fill, no shadow, accent border on focus. 48 px tall.
- Quick picks: white pills with a hairline border; points next to the label in `muted`.
- Chore feed: title in medium, who did it underneath. A thanked chore gets an
  `accent-soft` "Kudos from Lea" tag. Points in `accent-ink` on the right.
- Sections are plain white with a heading. Panels (`surface`, 12 px radius, no border, no
  shadow) only where something needs to stand apart.

## Copy

- British English: "flatmate", "bins", "colour". No em dashes.
- Credit, never blame. Say what got done and who did it. The lowest score is "on
  forfeit watch", never "the laziest".
- Cheeky in small doses: one wink per screen, usually about the forfeit. Naming the last
  flatmate as a joke is only allowed on the landing page's made-up sample board.
- Buttons say what happens: "Log it", "Sign up free", "Copy invite link".
- Empty states invite an action: "Nothing logged yet. Did the dishes today? Log it above."

## Do

- Leave white space. If a screen feels busy, remove a panel before shrinking text.
- Keep the 5-second test on the landing page: who it is for, what they get, one sign-up
  button, all visible without scrolling on a phone.
- Check 375 px wide (no horizontal scroll, 44 px tap targets), keyboard focus, and dark
  mode.

## Don't

- No Strava orange, no gradients, no drop shadows on cards.
- No tracked-out caps eyebrows, no middle-dot strings ("Flat 3B · October"), no "→" on
  buttons, no numbered 01/02/03 cards.
- No stack of identical rounded cards. Vary the structure by what the content is.
- Never rename or remove a `data-testid`. `core-input` stays a plain text field.
