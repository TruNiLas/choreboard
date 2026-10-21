# Choreboard design

Choreboard is a scoreboard for a shared flat. The design borrows from two places: the
stadium scoreboard (big condensed numbers, ranks that move) and the flat itself (bathroom
tiles, rubber gloves, washing-up liquid). It should feel like a game you want to win,
never like a rota pinned to the fridge.

The website is the product, so the landing page tells a story: scroll down and a month
in one flat plays out on the scoreboard, ending with the forfeit ticket. Reference for
the energy (not the look): learnwithzero.com, a page where things happen as you scroll
and the buttons feel physical.

## Colour

Tokens live in `src/app/globals.css`, once for light and once for dark. Components use
tokens (`bg-surface`, `text-muted`), never palette colours. Token names are older than
this palette, so the table says what each one is now.

| Token | Name | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `background` | Tile | `#eef3f5` | `#0d1628` | Page, with a faint tile grid on hero areas |
| `surface` | Clean tile | `#ffffff` | `#15213a` | Inputs, panels, secondary buttons |
| `foreground` | Ink | `#13213c` | `#eef3f5` | Text |
| `muted` | Slate | `#56677c` | `#9aa9bd` | Secondary text |
| `border` | Grout | `#cdd9df` | `#24344f` | Hairlines, the tile grid |
| `accent` | Glove | `#ffc83d` | `#ffc83d` | Primary buttons, the forfeit ticket |
| `accent-foreground` | Ink on glove | `#13213c` | `#13213c` | Text on glove yellow |
| `accent-edge` | Glove shadow | `#d9a21c` | `#c78f0e` | The 3D bottom edge of primary buttons |
| `accent-soft` | Glove tint | `#fff2cc` | `#3a3216` | Invite prompt, nudge banner |
| `accent-ink` | Suds | `#178a50` | `#4fd690` | Points and kudos, as text |
| `board` | Scoreboard | `#13213c` | `#070e1c` | The scoreboard |
| `board-foreground` | | `#ffffff` | `#ffffff` | Text on the scoreboard |
| `board-muted` | | white 64% | white 60% | Ranks, dates on the scoreboard |
| `board-line` | | white 12% | white 10% | Rows and the grid on the scoreboard |
| `board-highlight` | Suds bright | `#4fd690` | `#4fd690` | The leader's score, points that just landed |
| `stub` / `stub-foreground` | Glove ticket | `#ffc83d` / `#13213c` | same | The forfeit ticket |
| `danger` | | `#c2361f` | `#ff7a63` | Errors, destructive confirmations |
| `success` | | `#178a50` | `#4fd690` | "Done by …" |

Glove yellow means "act" or "forfeit". Suds green means "credit". Ink carries everything
else. No gradients as decoration.

## Type

- **Big Shoulders** (variable, 800 to 900): headlines, scores, the wordmark. Condensed
  stadium numerals. Tight tracking, line height about 0.9 at display sizes. Sentence case.
- **Figtree** (400, 500, 600, 700): body, labels, buttons, names.
- Scale: 14 / 16 / 18 / 22 / 32 / 48 / 72 / 112 px. Body at 16 to 18 px, lines under 70
  characters.
- Scores always `tabular-nums`.
- No all-caps labels, no monospace, no single highlighted word in a headline.

## Shape and depth

- Radius by role, not one radius for everything: buttons are pills, the scoreboard 28 px,
  panels 20 px, inputs 14 px.
- Buttons are physical: a 4 px darker bottom edge (`box-shadow: 0 4px 0 edge`), lift 1 px
  on hover, press 3 px down on click, 150 ms ease. Primary is glove yellow with ink
  text; secondary is clean tile white with an ink edge.
- The scoreboard and the forfeit ticket are the only things with a soft drop shadow.

## Logo

A clean plate seen from above (ink rim, white plate) with a suds-green tick on it, next
to the wordmark "Choreboard" in Big Shoulders 800. Component: `src/components/logo.tsx`.

## Layout

- Use the full width. Sections are full-bleed with their own background; text blocks stay
  under 70 characters, but scoreboards, grids and tickets spread out.
- Content container up to 80rem with 16 px gutters on phones, 32 to 48 px on desktop.
- Left-aligned text everywhere except the closing call to action.

### Landing (`/`)

1. Hero, full viewport: tile grid, the headline "The chore leaderboard for shared flats.",
   one line on what you get, "Sign up free". The scoreboard sits beside it on desktop and
   below it on phones; its scores count up once on load.
2. "A month in Flat 3B": the signature moment. The scoreboard pins while the story beats
   scroll past (a chore, a kudos, a nudge, a comeback). Each beat that reaches the middle
   of the screen updates the scores and the ranks slide into their new order. The last
   beat is the forfeit ticket tearing in.
3. The forfeit: a full-bleed glove-yellow band.
4. Closing call to action on ink.
5. A floating dock (logo mark, "Sign up free", "Log in") appears once the hero button has
   scrolled away and hides at the closing call to action.

### Board (`/app`)

Desktop: two columns. Left, sticky: the scoreboard, the race line, the forfeit ticket.
Right: nudges, log a chore, this week's duties, recent chores, then the flat settings.
Phones: one column in that order.

### Sign up and log in

Desktop: split screen, ink panel with the tile grid and a small scoreboard on the left,
the form on the right. Phones: the form only.

## Motion

- One orchestrated sequence per page: the month playing out on the landing page. The
  hero count-up is its opening.
- Motion that answers an action is welcome: button press, ranks reordering after you log
  a chore.
- `prefers-reduced-motion`: no count-up, no sliding; the story shows its final state.
- No fade-up on every section, no hover animations on every card.

## Copy

- British English: "flatmate", "bins". No em dashes.
- Credit, never blame. The lowest score is "on forfeit watch", never "the laziest".
- Cheeky in small doses, usually about the forfeit. Naming the last flatmate as a joke
  is only allowed on the landing page's made-up flat.
- Buttons say what happens: "Log it", "Sign up free", "Copy invite link".

## Don't

- Never rename or remove a `data-testid`. `core-input` stays a plain text field.
- No purple, no cream-and-terracotta, no black with an acid accent.
- No stack of identical cards, no numbered 01/02/03 markers, no "→" on buttons, no
  middle-dot strings.
- No new dependencies for motion: CSS transitions plus small IntersectionObserver hooks.
