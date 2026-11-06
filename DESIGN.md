---
name: LinkedOut
description: A neutral shadcn popup that sets which job cards disappear and reads back what this list did.
colors:
  background: 'oklch(1 0 0)'
  foreground: 'oklch(0.145 0 0)'
  popover: 'oklch(1 0 0)'
  popover-foreground: 'oklch(0.145 0 0)'
  muted: 'oklch(0.97 0 0)'
  muted-foreground: 'oklch(0.556 0 0)'
  accent: 'oklch(0.97 0 0)'
  accent-foreground: 'oklch(0.205 0 0)'
  border: 'oklch(0.922 0 0)'
  ring: 'oklch(0.708 0 0)'
  destructive: 'oklch(0.577 0.245 27.325)'
  background-dark: 'oklch(0.145 0 0)'
  foreground-dark: 'oklch(0.985 0 0)'
  popover-dark: 'oklch(0.205 0 0)'
  popover-foreground-dark: 'oklch(0.985 0 0)'
  muted-dark: 'oklch(0.269 0 0)'
  muted-foreground-dark: 'oklch(0.708 0 0)'
  accent-dark: 'oklch(0.269 0 0)'
  accent-foreground-dark: 'oklch(0.985 0 0)'
  border-dark: 'oklch(1 0 0 / 10%)'
  input-dark: 'oklch(1 0 0 / 15%)'
  ring-dark: 'oklch(0.556 0 0)'
  destructive-dark: 'oklch(0.704 0.191 22.216)'
typography:
  title:
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: '-0.025em'
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: '1.25rem'
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: '1.25rem'
rounded:
  md: '0.5rem'
  lg: '0.625rem'
spacing:
  stack-gap: '0.25rem'
  field-gap: '0.375rem'
  panel: '1rem'
  section: '1.25rem'
components:
  hide-trigger:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    typography: '{typography.body}'
    rounded: '{rounded.lg}'
    padding: '0 0.5rem 0 0.625rem'
    height: '2.25rem'
    width: '100%'
  hide-trigger-hover:
    backgroundColor: '{colors.muted}'
    textColor: '{colors.foreground}'
  hide-trigger-open:
    backgroundColor: '{colors.muted}'
    textColor: '{colors.foreground}'
  hide-menu:
    backgroundColor: '{colors.popover}'
    textColor: '{colors.popover-foreground}'
    rounded: '{rounded.lg}'
    padding: '0.25rem'
    width: '100%'
  hide-menu-row:
    textColor: '{colors.popover-foreground}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '0.25rem 2rem 0.25rem 7px'
    height: '1.75rem'
  hide-menu-row-focus:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-foreground}'
  field-label:
    textColor: '{colors.foreground}'
    typography: '{typography.label}'
  status-plain:
    textColor: '{colors.foreground}'
    typography: '{typography.body}'
  status-muted:
    textColor: '{colors.muted-foreground}'
    typography: '{typography.body}'
  status-failure:
    textColor: '{colors.destructive}'
    typography: '{typography.body}'
---

# Design System: LinkedOut

## Overview

**Creative North Star: "The Single Readout"**

LinkedOut is stock shadcn on the neutral base, used at its smallest honest size: a name, one line of status, and one control. The world is the user's pinned choice. The popup does not decorate that world; it holds to its tokens and lets the status line carry all the meaning a glance needs.

Density is that of a browser extension popup, opened for a few seconds in the middle of a job search. Hierarchy comes from weight and tone, not from scale or color. Chroma appears only when something has failed, so red always means the same thing.

**Key Characteristics:**

- Achromatic shadcn neutrals, with the destructive red as the only hue.
- One status line that changes tone, never a second message surface.
- A 20rem panel with a height floor that reserves room for the portalled menu.
- Flat at rest. Only the open menu lifts.
- Light and dark follow the operating system, with no in-product switch.

## Colors

A strictly achromatic palette, zero chroma on every neutral, with one red held back for failure. Values live in `entrypoints/popup/style.css` as shadcn custom properties under the same names; the `-dark` keys above are what those names resolve to under `prefers-color-scheme: dark`.

### Neutral

- **Sheet White / Night Sheet** (`background`, `background-dark`): The panel behind everything, and the trigger's face in light.
- **Ink / Paper Ink** (`foreground`, `foreground-dark`): The name, field label, trigger text, and the plain status tone.
- **Faded Ink** (`muted-foreground`, `muted-foreground-dark`): Idle status guidance and the trigger's chevron.
- **Soft Gray / Raised Gray** (`muted`, `muted-dark`): The trigger when hovered or open.
- **Menu Sheet** (`popover`, `popover-foreground` and their `-dark` keys): The open menu. Identical to the panel in light, one tonal step up in dark.
- **Row Highlight** (`accent`, `accent-foreground` and their `-dark` keys): The focused menu row.
- **Hairline** (`border`, `border-dark`): The trigger's outline in light, and the scrollbar thumb in both schemes.
- **Field Wash** (`input-dark`): Dark only. The trigger's outline at full strength, its face at 30%, its hover at 50%.
- **Focus Gray** (`ring`, `ring-dark`): The focus border, and at 50% the 3px focus ring.

### Semantic

- **Failure Red** (`destructive`, `destructive-dark`): Status text when a read, a page check, or a save has failed. Computed 4.76:1 on the light panel and 6.84:1 on the dark one.

### Named Rules

**The Three Tones Rule.** The status line has exactly three tones. Plain ink states what this list is doing. Faded ink is idle guidance when there is no list to act on. Failure red is any failure. There is no success color; a working list reads in plain ink.

**The Red Means Failed Rule.** Failure Red is the only chroma on the surface. If a popup element has hue and nothing has failed, it is wrong.

**The Follow the System Rule.** `prefers-color-scheme` alone selects the scheme, for the tokens, for the `dark:` variant, and for the native `color-scheme`. There is no class toggle and no in-product switch.

## Typography

**Body Font:** The Tailwind default sans stack, the platform's own UI face. No font is bundled.

**Character:** Plain interface text that sits comfortably beside the browser's own chrome. It carries controls and status; it is not a chosen voice.

### Hierarchy

- **Title** (600, 1rem, 1.5, tracking -0.025em): The product name, once, as the panel's only heading. It currently inherits the UI stack; that is a carried condition, not a display-face decision, and no family is recorded for this role.
- **Body** (400, 0.875rem, 1.25rem): The status line, trigger text, and menu rows. The trigger sets weight 400 explicitly, overriding the button's default 500, so it reads as a value and not as an action.
- **Label** (500, 0.875rem, 1.25rem): The field label above a control.

### Named Rules

**The Weight Not Size Rule.** The panel uses two sizes, 1rem and 0.875rem. Everything else in the hierarchy is weight and tone.

**The Field Label Rule.** A label names the control directly beneath it, in sentence case, because the control's value alone would have no verb. It never sits above a heading, and it is never uppercase or tracked out.

## Layout

The panel is one column, 20rem wide on `html`, `body`, and the root, with 1rem inline padding, leaving an 18rem measure. Top padding is 1.25rem and bottom padding 1rem. The name and status stack 0.25rem apart; 1.25rem separates that block from the field; the field label sits 0.375rem above its trigger.

Width is fixed. Height is a floor: `body` carries a 14.75rem `min-height`, and content may push past it. The status line keeps a 1.25rem minimum height, so an empty line while the page report is pending does not move the field below it.

There are no breakpoints. The popup has one width.

### Named Rules

**The Reserved Room Rule.** The menu is portalled, so it adds nothing to the document's height, and a popup window sized to its content would clip it. The body's height floor exists to hold the open menu. The closed content ends at 10.375rem including bottom padding; the trigger's bottom edge is at 9.375rem, and the menu begins 0.25rem below it. A menu of n rows ends at 9.625rem + 0.5rem + (n × 1.75rem). The 14.75rem floor holds two rows and leaves 1.125rem below the menu. Below 13.625rem the menu flips above the trigger and covers the status line and label. When a row is added, raise the floor by 1.75rem.

**The Shared Edge Rule.** Menu rows align to the trigger above them. Row text starts 11px from the shared left edge, as the trigger's text does (trigger: 1px border + 10px padding; row: 4px menu padding + 7px). The check centers on the trigger's chevron, both 16px and both ending 9px from the right edge (trigger: 1px + 8px; row: 4px + 5px). The menu takes the trigger's exact width. Those offsets are set where the menu is used, not in the vendored component.

## Elevation & Depth

Flat by default. The panel and trigger have no shadow; the trigger's edge is a hairline. The open menu is the only raised element: a soft shadow plus a hairline ring in ink at 10%, drawn inside the menu's edge. In dark, where a shadow barely reads, the same menu separates by its one-step lighter sheet.

### Shadow Vocabulary

- **Menu Lift** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): The open dropdown only.

### Named Rules

**The One Lift Rule.** Only what floats over the panel lifts. Anything in the panel's own flow stays flat.

## Shapes

Gently rounded and consistent: 0.625rem on the outer forms, the trigger and the menu, and 0.5rem on the rows nested inside the menu. Everything derives from the single `--radius` custom property. Edges are 1px hairlines. There are no pills, no sharp corners, and no clipped silhouettes. Icons are Lucide line icons at 16px.

## Components

### Hide Field

A label and a full-width dropdown trigger, quiet enough to read as a current value.

- **Shape:** Softly rounded (0.625rem), 2.25rem tall, full width.
- **Trigger:** Outline button at large size with its text at weight 400, left aligned, and the chevron pushed to the far end in Faded Ink. The text is the selected statuses joined by commas, or "Nothing hidden".
- **Hover / Open:** Face moves to Soft Gray. Open also turns the chevron 180° over 150ms. Dark uses the Field Wash at 30%, and 50% on hover.
- **Focus:** Border moves to Focus Gray with a 3px ring at 50%.
- **Press:** The trigger does not take the button's 1px press nudge, because it opens a menu.

### Hide Menu

Each status is a checkable row in one menu; the checkbox is the action.

- **Shape:** Softly rounded sheet (0.625rem) with 0.25rem padding, exactly the trigger's width, 0.25rem below it. Rows are 1.75rem tall, softly rounded (0.5rem), and stack flush.
- **Rows:** Body type, with a 16px check at the row's end when selected and blank space when not. Row alignment follows the Shared Edge Rule.
- **Focus:** Row Highlight fills the row, and its text and check follow.
- **Behavior:** Non-modal. Toggling a row keeps the menu open, so several statuses can be set in one visit, and the trigger text and status line update behind it.
- **Motion:** Opens in 100ms with a fade, a 95% zoom, and a slide from the trigger's side.

### Status Line

One line directly under the name; the panel's main message.

- **Tones:** Plain for this list's state ("12 cards hidden on this list", "No cards to hide on this list", "Showing every card"). Muted for idle guidance ("Open a Jobs search to hide cards"). Destructive for any failure.
- **Failures:** The line replaces its text rather than adding a surface. A save failure takes precedence over everything else, then an unreadable stored choice, then a failed page check. Every failure line says what failed and then the recovery, in two short sentences ("Could not check this list. Reload the tab.").
- **Pending:** Empty, at its reserved height, in the muted tone. The control does not appear until the stored choice has loaded.
- **Announcement:** A live status region, so the change reaches assistive technology.

### Buttons

Only the outline variant at large size is rendered, as the Hide Field trigger. The vendored `components/ui/button.tsx` keeps shadcn's other variants, which are not part of this record until a surface renders one.

## Do's and Don'ts

### Do:

- **Do** read every color from the shadcn custom properties in `entrypoints/popup/style.css`, so both schemes follow without extra work.
- **Do** use the Three Tones as the only status treatments: plain for this list's state, muted for idle guidance, destructive for any failure.
- **Do** add a hideable status as another row in the Hide Menu, then raise the 14.75rem floor per the Reserved Room Rule.
- **Do** keep status text to one line of the 18rem measure at 0.875rem. "Could not load your choice. Choose again." is near the limit.
- **Do** keep menu rows on the trigger's text and chevron edges, per the Shared Edge Rule.
- **Do** keep browser surfaces on the palette: selection inverts ink and sheet, and the scrollbar thumb uses Hairline on a transparent track.
- **Do** collapse animation and transition durations to 0.01ms under `prefers-reduced-motion: reduce`.

### Don't:

- **Don't** add a success color or any new hue. A list that is working reads in plain ink.
- **Don't** use Failure Red on the status line for anything that has not failed.
- **Don't** add a second message surface, such as a banner or toast, alongside the status line.
- **Don't** write raw color values at a call site, or override a token per scheme outside the stylesheet.
- **Don't** add a theme switch or class-based dark mode. The operating system decides.
- **Don't** lift the panel, the trigger, or anything else in the panel's flow with a shadow.
- **Don't** assume the 14.75rem floor is enough for a longer menu. It holds two rows.
