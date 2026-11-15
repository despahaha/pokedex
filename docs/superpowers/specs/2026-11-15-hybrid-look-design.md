# Hybrid look and bottom search

## Why

The owner liked the card-style Pokédex on vn.portal-pokemon.com: rounded cards, soft colours, a large
picture, and stats that are easy to read. They also wanted the search bar within thumb reach, next to the
keyboard, the way Safari's address bar sits at the bottom. They still like the pixel feel of the game.

## Goals

- Rounded cards and readable numbers throughout the app.
- Keep pixel character where it matters: the POKéDEX title, section headings, type badges, numbers like
  `No.0522`, and the Black/White sprites.
- Evolution shown as playing cards, like the reference site.
- One colour for every selected state: Bright Blue `#0096FF`, picked by the owner's brief from
  htmlcolorcodes.com/colors/shades-of-blue (a sea blue that is not dark).
- Search at the bottom, usable from every tab, riding on top of the keyboard while typing.

## Non-goals

- Copying the reference site's logo, Poké Ball artwork or layout. The disc behind each sprite is a plain
  circle tinted with the Pokémon's first type.
- Official artwork. Pictures stay the Black/White sprites loaded from the PokeAPI sprite host.
- Changing any data, the Dock view's content, or the Scriptable widget.

## Approaches considered

1. **Preview page first, then roll into the app (chosen).** A throwaway page at `/preview/` let the owner
   try the look and the keyboard behaviour on their iPhone before the app changed. They approved it with one
   bug to fix and asked for the whole design to go in at once rather than in stages.
2. Restyle the app in stages with no preview. Faster, but any miss lands on the app they use daily.
3. Restyle everything blind in one go. Rejected: the keyboard behaviour cannot be tested off-device.

## Design

- **Styles** move out of `src/page.html` into `src/style.css`; the build inlines them. Tokens: soft
  periwinkle background, white cards with an 18px radius and a soft shadow, a dark theme with the same
  shapes. Body text uses the system rounded font (`ui-rounded`); Press Start 2P stays for headings and labels.
- **Bottom bar** (`.bottom`): a floating search pill above a pill-shaped tab row. Typing opens a results
  sheet above the bar (first 40 matches across all 649 Pokémon, Unova first when browsing Unova). The Dex
  list is no longer filtered by typing; its chips (Unova, All, Uncaught, Type) still filter it.
- **Keyboard**: the bar is lifted by the keyboard's height, read from `visualViewport`. While typing, the
  tabs hide and the safe-area padding is dropped so the bar sits directly on the keyboard.
- **The bug found on the preview**: picking a result changed page while the keyboard was still sliding
  away, and iOS left the sticky header in the middle of the screen. Picking now blurs the field, waits for
  the keyboard to finish closing, then navigates; the router also re-applies the scroll position on the next
  frame, and a no-op scroll runs once the keyboard is gone.
- **Pokémon card**: frame in the first type's colour, name and species, a large sprite on a disc with round
  previous/next buttons beside it, three tiles for height, weight and gender, abilities, then the team,
  caught and sprites buttons.
- **Evolution cards**: one card per family member with its number, a type-coloured corner and the sprite.
  The condition (for example `Lv 27`) sits above the evolved form. A straight line of up to three stays in
  one row (two-stage families get larger cards); anything that branches stacks by stage. Full conditions are
  listed underneath.

## Testing

`tests/app.test.js` covers the bar's position, results opening above it, picking a result, clearing, search
beyond the Unova list, the blue selected tab, evolution cards for a line and for Eevee's branches, and the
round previous/next buttons. Keyboard behaviour cannot be exercised in Chromium and needs a check on the
owner's iPhone after each change to that code.
