---
name: LinkedOut
description: A ledger-style popup that reads like a short document of what LinkedOut is doing, with blue reserved for what is switched on and for the action that fixes something.
colors:
  background: '#FDFCFA'
  foreground: '#23211E'
  muted: '#F4F2EE'
  muted-foreground: '#6B665E'
  border: '#E8E5DF'
  input: '#D6D2CA'
  primary: '#0A66C2'
  primary-foreground: '#FFFFFF'
  accent-text: '#0A66C2'
  ring: '#0A66C2'
  tint: '#E6F0FA'
  key: '#FFFFFF'
  key-edge: '#D6D2CA'
  well: '#F4F2EE'
  destructive: '#B42318'
  background-dark: '#1E1D1B'
  foreground-dark: '#ECEAE6'
  muted-dark: '#292825'
  muted-foreground-dark: '#A9A49B'
  border-dark: '#363431'
  input-dark: '#4C4945'
  primary-dark: '#0A66C2'
  primary-foreground-dark: '#FFFFFF'
  accent-text-dark: '#70B5F9'
  ring-dark: '#70B5F9'
  tint-dark: '#16304A'
  key-dark: '#2A2926'
  key-edge-dark: '#0F0E0D'
  well-dark: '#171614'
  destructive-dark: '#F2826F'
typography:
  name:
    fontSize: '0.875rem'
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: 1.45
  group:
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.45
  figure:
    fontSize: '0.8125rem'
    fontWeight: 600
    fontVariantNumeric: tabular-nums
  key:
    fontSize: '0.75rem'
    fontWeight: 500
rounded:
  key: '5px'
  control: '6px'
  surface: '10px'
spacing:
  inset: '12px'
  row: '28px'
  label-column: '104px'
components:
  row:
    height: '28px'
    padding: '0 12px'
    rounded: '{rounded.control}'
  row-hover:
    backgroundColor: '{colors.muted}'
  switch-off:
    backgroundColor: '{colors.input}'
    size: '26px × 16px'
  switch-on:
    backgroundColor: '{colors.primary}'
  key:
    height: '24px'
    padding: '0 9px'
    rounded: '{rounded.key}'
    backgroundColor: '{colors.key}'
    border: '1px {colors.border}, bottom 2px {colors.key-edge}'
    typography: '{typography.key}'
  key-hover:
    borderBottomColor: '{colors.primary}'
    transform: 'translateY(-1px)'
  key-busy:
    sweep: '{colors.tint}'
---

# Design System: LinkedOut

## Overview

**Creative North Star: "The Ledger"**

The popup is a short ledger of what LinkedOut is doing on this page. It reads top to bottom like a document: a line of figures, then a few groups of rows. Each row is a muted label on the left and its current value on the right. Nothing looks like a form until the pointer reaches it.

It is opened for a few seconds in the middle of a job search, so it is dense and quiet. Warm paper neutrals carry the structure. Blue appears only where something is switched on or where an action fixes something, and red only where something has failed. A seeker can tell what is on from across the screen without reading a word.

Buttons are small keys. They have a neutral face, a heavier bottom edge, and a blue icon. A key lifts when the pointer reaches it and sinks when pressed. Each icon acts out its verb: links close on Connect, part on Disconnect, a plus turns on New sheet.

**Key Characteristics:**

- One column, 352px wide, 12px inset.
- A readout of up to three figures under the name.
- Label-and-value rows, 28px tall, borderless until hover.
- Hairline dividers between groups, no shadows in the popup.
- Blue means on, or the fix. Red means failed. Nothing else has hue.
- Keys, not filled buttons: the face stays neutral, the icon carries the blue.
- Light and dark follow the operating system.

## Colors

Warm, low-chroma paper neutrals, one blue and one red. Values live as custom properties in the shared stylesheet, under the names in the front matter. The `-dark` keys are what those names resolve to under `prefers-color-scheme: dark`.

### Neutral

- **Paper / Night Paper** (`background`): The page behind everything.
- **Ink / Night Ink** (`foreground`): The name, row values, figures, key labels.
- **Pencil** (`muted-foreground`): Row labels, group labels, idle messages, neutral key icons. 5.5:1 on Paper, 6.9:1 on Night Paper.
- **Wash** (`muted`): A row or icon button under the pointer.
- **Rule** (`border`): Hairline dividers, the outline of keys and the number box.
- **Off Track** (`input`): A switch that is off.
- **Key face and Key edge** (`key`, `key-edge`): The face and the heavier bottom edge of a key.
- **Well** (`well`): The sunken search field on the settings page.

### Accent

- **Blue** (`primary`): `#0A66C2` in both schemes. It fills a switch that is on and the slider's filled part, and edges a key under the pointer.
- **Blue text** (`accent-text`, `ring`): Key icons, and the focus ring. `#0A66C2` on Paper; `#70B5F9` on Night Paper, where the fill blue is too dark to read.
- **Tint** (`tint`): The pale sweep across a key while its action runs.

### Semantic

- **Failure Red** (`destructive`): Any failure: the message line, the tracker's expired sign-in or missing sheet, a failed unblock.

### Named Rules

**The On Rule.** Blue marks state, not decoration. If something is blue, it is switched on, it is the action that fixes a problem, or it has focus.

**The Quiet Key Rule.** No button is solid blue. A key's face stays neutral; only its icon, and its edge under the pointer, turn blue.

**The Red Means Failed Rule.** Red is only for something that failed. There is no success colour; a list that is working reads in plain ink.

**The Follow the System Rule.** `prefers-color-scheme` alone picks light or dark. There is no in-product switch.

## Typography

The platform's own UI font at 13px. No font is bundled.

### Hierarchy

- **Name** (600, 14px): "LinkedOut" in the header, once.
- **Body** (400, 13px): Row values and messages.
- **Group** (400, 12px, Pencil): The small label above each group of rows.
- **Figure** (600, 13px, tabular): The numbers in the readout, so they do not shift as they change.
- **Key** (500, 12px): Key labels.

### Named Rules

**The Label Column Rule.** Every row's label sits in a fixed column in Pencil (104px in the popup, 120px on the settings page), so values line up and read as a list.

**The Sentence Case Rule.** Labels and buttons are sentence case. Nothing is uppercase or letter-spaced.

## Layout

The popup is one column, 352px wide. The header and readout use a 12px inset. Group rows span the full width with 12px inner padding, so their hover wash reaches the edges. Chrome draws the popup's frame, so its outer corners are whatever the browser gives it.

Top to bottom:

1. **Header.** The logo mark at 18px, the name, and a settings icon button at the far right.
2. **Readout.** One line of up to three figures with labels: Hidden here, Tracked, Blocked.
3. **Message line.** Shown only when there is something to say, under a hairline.
4. **Tracker problem.** Shown only when Google sign-in has expired, with the Reconnect key.
5. **Hide from results.** Four rows, one per status.
6. **Applicant count.** The limit row and the slider row.
7. **Job tracker.** The sheet rows, or the Connect row.

Height follows content.

The settings page is a separate tab: a centred frame about 760px wide, with a sidebar on the left and the selected pane on the right.

## Elevation & Depth

Flat. Structure comes from hairlines and the label column, never from shadows. Keys get their depth from the heavier bottom edge, not a shadow. The search well is sunken with a 1px inner shadow. The only lifted surface is the on-page Block panel, which floats over LinkedIn and needs a soft shadow to separate from the page.

## Shapes

5px corners on keys, 6px on rows and the number box, 10px on surfaces (the Block panel, the settings frame). Switches, the slider thumb and the account initial are fully round. Icons are 14 to 16px line icons with a 2px stroke.

## Motion

Motion is small and says what a control does. It runs on transform, opacity and stroke offsets, uses an ease-out curve, and stops under `prefers-reduced-motion: reduce`.

- **Settings gear.** Turns a quarter on hover, over 500ms.
- **Icon buttons.** Shrink to 90% while pressed. The × on a blocked company turns a quarter on hover.
- **Keys.** Lift 1px on hover, sink 1px on press.
- **Key icons.** Connect's links close and draw their middle bar. Disconnect's links part and show two break marks. New sheet's plus turns a quarter. The open-sheet arrow nudges up and right. Block's slash draws across the circle.
- **Busy key.** The label changes to the running verb (Connecting…, Creating…, Reconnecting…, Disconnecting…), the key is disabled, its edge turns blue, and a tint sweeps across its face from the left and holds near the end until the work finishes. The icon keeps moving: the plus spins, the link bar throbs.
- **Switch.** The knob slides 10px with a slight overshoot.

## Components

### Header

The logo mark, `LinkedOut` in Name type, and a 28px ghost icon button with a gear, named `Open settings`, which opens the settings page.

### Readout

One line: `Hidden here 12   Tracked 38 · 2 waiting   Blocked 7`. Labels in Pencil, figures in Figure type, 14px apart.

- **Hidden here** is the count of cards hidden on the current Jobs list. It reads `–` when there is no Jobs list or the page check failed.
- **Tracked** is the number of jobs added to the sheet, followed by `· N waiting` in Pencil when rows are waiting. It is left out when the tracker is not connected or not in the build.
- **Blocked** is the number of blocked companies. It is left out when the list cannot be read.

### Message Line

One line under a hairline, only when needed. Pencil for guidance and pauses ("Open a Jobs search to hide cards", "Reposted check paused by LinkedIn limits"). Failure Red for failures, each saying what failed and then how to recover ("Could not check this list. Reload the tab."). Failures take precedence in this order: a failed save, an unreadable blocklist, an unreadable hide choice, a failed page check. It is a live status region.

### Setting Row

A 28px row: label in the label column, value text, and a switch at the far right. The whole row is the switch's hit area and carries `role="switch"`. Hover fills the row with Wash; keyboard focus draws a 2px blue ring inside the row.

- **Hide rows.** Label is the status (Applied, Viewed, Saved, Reposted). Value is `Hidden` or `Shown`. Changing a row saves at once.
- **Limit row.** Label `Limit`, value `Hide over N` or `Off`.

### Switch

26px × 16px, fully round. Off: Off Track with a light knob. On: Blue with the knob 10px to the right.

### Slider Row

Label `Max applicants`, a 4px track in Rule with the filled part in Blue and a 14px round thumb outlined in Blue, then a 56px number box with tabular digits. It moves through 13 stops from 10 to 2000. The row is at 50% opacity while the limit is off.

### Key

The only button style. 24px tall, 9px side padding, 5px corners, a 1px Rule border with a 2px Key edge along the bottom, Key face, Ink label in Key type, and a leading 14px icon in Blue text.

- **Neutral key.** The icon is in Pencil and the hover edge is Pencil. Used for Cancel and Disconnect, which fix nothing.
- **Icon key.** 24px square, icon only, with an accessible name. Used for Open sheet.
- **Busy.** See Motion.

### Job Tracker Rows

Actions sit at the right end of their row.

- **Connected.** `Sheet` with the sheet's name and an Open sheet icon key; `Status` with `N jobs added`.
- **Not connected.** `Sheet` with the `Connect Google Sheets` key.
- **Sheet missing.** `Sheet` with `Not found` in Failure Red and the `New sheet` key.
- **Sign-in expired.** The tracker problem line at the top of the popup reads `Google sign-in expired.` in Failure Red with the `Reconnect` key.

Disconnect is not in the popup. It lives in the settings page's Account pane.

### Settings Page

A sidebar and one pane.

- **Sidebar.** The logo and `LinkedOut settings`, then two items: `Blocked companies` with its count, and `Account` with `On`, `Off`, or `Needs you` in Failure Red. The selected item is drawn as a raised key. Account is left out in a build without Google settings.
- **Blocked companies.** A title, one line of guidance in Pencil, a sunken search well with a search icon and a `/` key hint (pressing `/` focuses it), then one 32px row per matching company, divided by hairlines: the name and an × icon button named `Unblock <Company>`. Unblocking is immediate. A search with no match reads `No blocked company matches "<text>".` The empty list reads "No blocked companies. Block one from a job card or the job details." A failed unblock shows one Failure Red line under the title and keeps the row. An unreadable list shows "Could not load blocked companies." and no rows.
- **Account.** A title and one line of guidance, then 38px rows with a 120px label column: `Google account` with the account and a neutral `Disconnect` key (and `Reconnect` before it when sign-in has expired), `Sheet` with its name and the Open sheet key, and `Jobs added` with the count. Not connected, the pane holds the `Google account` row with `Connect Google Sheets` at its right end. A Pencil line under the rows says what disconnecting does.

### Block Control and Confirmation Panel

These render on the LinkedIn page, not in the popup. The card control and the job pane button keep their placement and shape, and draw in the page's current text colour. The confirmation panel lives in a shadow root and uses this system's tokens as literal values: Paper face, Rule border, 10px corners, a soft shadow, the title in 14px semibold, the body in Pencil, a neutral `Cancel` key and a `Block` key with a ban icon. It follows the colour scheme.

## Do's and Don'ts

### Do:

- **Do** read every colour from the custom properties, so both schemes follow.
- **Do** put new settings in a Setting Row under the right group.
- **Do** put a row's action at its right end.
- **Do** keep message text to one line at 352px.
- **Do** give every key icon a motion that says its verb, and stop it under reduced motion.

### Don't:

- **Don't** fill a button with blue, or fill one blue on hover.
- **Don't** use blue for anything that is not on, a fix, or focus.
- **Don't** add a success colour, a banner, or a toast.
- **Don't** add shadows inside the popup or the settings page.
- **Don't** borrow LinkedIn's pills, type or card style.
- **Don't** add dropdowns or menus to the popup; every daily control is one click.
