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

The panel is one column, 20rem wide on `html`, `body`, and the root, with 1rem inline padding, leaving an 18rem measure. Top padding is 1.25rem and bottom padding 1rem. The name and status stack 0.25rem apart; 1.25rem separates that block from the field; the field label sits 0.375rem above its trigger. The Blocked Companies section follows the field 1.25rem below the trigger, and its list sits 0.375rem below its header.

Width is fixed. Height is a floor: `body` carries a 16.5rem `min-height`, and content may push past it. The status line keeps a 1.25rem minimum height, so an empty line while the page report is pending does not move the field below it.

There are no breakpoints. The popup has one width.

### Named Rules

**The Reserved Room Rule.** The menu is portalled, so it adds nothing to the document's height, and a popup window sized to its content would clip it. The body's height floor exists to hold the open menu. The closed content ends at 10.375rem including bottom padding; the trigger's bottom edge is at 9.375rem, and the menu begins 0.25rem below it. A menu of n rows ends at 9.625rem + 0.5rem + (n × 1.75rem). The 16.5rem floor holds three rows and leaves 1.125rem below the menu. The Blocked Companies section is in the panel's flow below the trigger, so the open menu covers it and does not move. With the section expanded and empty, the content ends just inside the 16.5rem floor, so the floor still sets the popup height. A longer list grows the panel past the floor, which only adds room below the menu. Below 15.375rem the menu flips above the trigger and covers the status line and label. When a row is added, raise the floor by 1.75rem.

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

### Applicant Limit

A section below the Hide Field that hides jobs with more applicants than a chosen number.

- **Layout:** Starts 1.25rem below the Hide Field, like the other sections. A row with a 16px checkbox and the label `Hide by applicant count` in Label type (weight 500), then 0.5rem below it a row with the slider filling the width and a number box, 4rem wide and 2rem tall, right aligned with tabular digits, 0.75rem apart.
- **Off:** The default. The slider and the number box are disabled at 50% opacity while the checkbox is clear; the number box still shows 100.
- **Slider:** A 4px track in Soft Gray with the filled part in Primary, and a 16px round thumb with a hairline Primary border. It moves through thirteen stops (10 to 2000), and a number-box value between stops puts the thumb on the nearest stop. Focus gives the thumb a 3px ring at 50%.
- **Number box:** Outline field with the Hide Field's radius and focus ring. It accepts whole numbers from 1 to 2000; an invalid entry reverts when the box is left.
- **Behavior:** Dragging, arrow keys, or a valid typed number change the cards at once without saving. Releasing the slider, leaving the box, or pressing Enter saves. The checkbox saves at once. Closing the popup mid-drag drops the unsaved preview.
- **Failure:** "Your applicant limit could not be saved. Try again." in the status line's destructive tone, with the control returning to the last saved value.

### Status Line

One line directly under the name; the panel's main message.

- **Tones:** Plain for this list's state ("12 cards hidden on this list", "No cards to hide on this list", "Showing every card"). The count is one number for cards hidden for a badge, a repost, an applicant count, or a blocked company. Muted also for "Reposted check paused by LinkedIn limits", which replaces the count while Reposted checks are backing off after LinkedIn throttles them (429, 999, or a network failure); a 403 or server error falls back to slower per-job checks and shows the normal count. "Applicant count check paused by LinkedIn limits" does the same when only the applicant limit needs the request. "Showing every card" appears only when no status is selected, the applicant limit is off, and no card is hidden; with nothing selected and blocked cards hidden, the line still carries the count. Muted for idle guidance ("Open a Jobs search to hide cards"). Destructive for any failure.
- **Failures:** The line replaces its text rather than adding a surface. A save failure takes precedence over everything else, then a blocklist failure (unblock failed or list unreadable), then an unreadable stored choice, then a failed page check. Every failure line says what failed and then the recovery, in two short sentences ("Could not check this list. Reload the tab."), except an unreadable blocklist, which has no recovery in the popup and says only what failed. Each failure line must fit one line at the 18rem measure, so the Hide trigger does not move and its menu keeps opening below it.
- **Pending:** Empty, at its reserved height, in the muted tone. The control does not appear until the stored choice has loaded.
- **Announcement:** A live status region, so the change reaches assistive technology.

### Blocked Companies

A collapsible section below the Hide Field. It lists the companies the seeker blocked.

- **Header:** A full-width ghost button that reads `Blocked companies (N)` in Label type, with the chevron in Faded Ink at the far end, on the trigger's chevron edge. It has no fill at rest, on hover, or when open, so it reads as a section label and not a field. Open turns the chevron 180° over 150ms, as the trigger does. It carries `aria-expanded` and controls the list region.
- **Collapsed:** The default each time the popup opens. The list region is hidden.
- **Empty:** The region shows "No blocked companies. Block one from a job card or the job details." in Body type and the muted tone. It wraps to two lines.
- **Rows:** One per company, newest first. The name is on the left in Body type and truncates. A 1.75rem ghost icon button with a 16px Lucide `X` is on the right, named `Unblock <Company>`. Rows stack 0.25rem apart. Unblocking is immediate, with no confirmation, and the row leaves when storage changes. A failed unblock keeps the row.
- **Long lists:** Chrome caps the popup at 600px tall. Past about 12 rows the whole popup scrolls; the Hide menu is unaffected.
- **Live:** The count and rows follow storage, so a block made on the page while the popup is open appears.
- **Unreadable:** The header reads `Blocked companies` with no count, and the region is empty, not the empty state. The status line shows the failure: "Could not load blocked companies." Reopening the popup does not help, so this line carries no recovery. A failed unblock shows "Could not unblock that company. Try again." and the row stays, so the name is not repeated. These take precedence over an unreadable hide choice and a failed page check, below a failed save.

### Block Control and Confirmation Panel

These render on the LinkedIn page, not in the popup.

- **Control:** A 40px round ghost icon button with a 16px Lucide `Ban`, inserted before LinkedIn's `Dismiss` button on each job card and positioned out of flow, centered directly below the `Dismiss` button, so showing it never changes the card's height, title wrap, or the `Dismiss` position. It is named `Block <Company>` with a matching tooltip. It is hidden with `visibility`, and shows only while the card is hovered or has focus inside it, and stays shown while its panel is open.
- **Detail pane button:** A 24px outline button with a 14px Lucide `Ban` and the text `Block`, inserted after the top-card company link in the job details pane and always visible. It is named `Block <Company>`, uses the current text color for its hairline border, and opens the same panel. An 8px left margin sets its distance from the name, and an auto right margin keeps it beside the name when the company row spreads its children apart, so it never drifts toward LinkedIn's `More options`. It follows the selected job and is absent when the top card has no company link. Once the company is blocked it becomes a disabled `Blocked` label at 60% opacity with no icon, named `Blocked <Company>`, and the pane stays on the same job. It returns to `Block` when the company is unblocked.
- **Panel:** Fixed 16px above the bottom of the viewport, centered, at most 448px wide, in a shadow root so LinkedIn CSS cannot reach it. It uses the neutral tokens as pixel and oklch values, with a hairline border and a soft shadow, and follows the color scheme. Title `Block <Company>?`, a muted body, then Cancel and a primary Block. Focus moves to the panel on open and returns to the trigger on close. Esc cancels. It never dismisses itself, and only one is open at a time. Block disables itself while the store writes and the panel closes when the write lands. If the store rejects the block, the panel stays open, Block is enabled again, and one line in Failure Red reads "Could not block this company. Try again." below the body, the panel's only failure surface.

### Buttons

The outline variant at large size is rendered as the Hide Field trigger. The ghost variant is rendered as the Blocked Companies header and the row unblock buttons. The vendored `components/ui/button.tsx` keeps shadcn's other variants, which are not part of this record until a surface renders one.

## Do's and Don'ts

### Do:

- **Do** read every color from the shadcn custom properties in `entrypoints/popup/style.css`, so both schemes follow without extra work.
- **Do** use the Three Tones as the only status treatments: plain for this list's state, muted for idle guidance, destructive for any failure.
- **Do** add a hideable status as another row in the Hide Menu, then raise the 16.5rem floor per the Reserved Room Rule.
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
- **Don't** assume the 16.5rem floor is enough for a longer menu. It holds three rows.
- **Don't** give the Blocked Companies header a fill or border. It is a section label that opens, not a field.
