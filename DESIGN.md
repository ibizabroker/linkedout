---
name: LinkedOut
description: A ledger-style popup that reads like a short document of what LinkedOut is doing, with colour reserved for what is switched on.
colors:
  background: '#FDFCFA'
  foreground: '#23211E'
  muted: '#F4F2EE'
  muted-foreground: '#6B665E'
  border: '#E8E5DF'
  input: '#D6D2CA'
  primary: '#3B5BDB'
  primary-foreground: '#FFFFFF'
  ring: '#3B5BDB'
  destructive: '#B42318'
  background-dark: '#1E1D1B'
  foreground-dark: '#ECEAE6'
  muted-dark: '#292825'
  muted-foreground-dark: '#A9A49B'
  border-dark: '#363431'
  input-dark: '#4C4945'
  primary-dark: '#8DA2F5'
  primary-foreground-dark: '#16171C'
  ring-dark: '#8DA2F5'
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
rounded:
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
  small-button:
    height: '26px'
    padding: '0 10px'
    rounded: '{rounded.control}'
    typography: '{typography.body}'
---

# Design System: LinkedOut

## Overview

**Creative North Star: "The Ledger"**

The popup is a short ledger of what LinkedOut is doing on this page. It is read top to bottom like a document: a line of figures, then a few groups of rows, each row a muted label on the left and its current value on the right. Nothing looks like a form until the pointer reaches it.

It is opened for a few seconds in the middle of a job search, so it is dense and quiet. Warm paper neutrals carry the structure. Indigo appears only where something is switched on, and red only where something has failed. A seeker can tell what is on from across the screen without reading a word.

LinkedOut sits on top of LinkedIn and must never look like part of it. It avoids LinkedIn's blue, its pill buttons, its type and its card-and-shadow feed.

**Key Characteristics:**

- One column, 352px wide, 12px inset.
- A readout of up to three figures under the name.
- Label-and-value rows, 28px tall, borderless until hover.
- Hairline dividers between groups, no shadows in the popup.
- Indigo means on. Red means failed. Nothing else has hue.
- Light and dark follow the operating system.

## Colors

Warm, low-chroma paper neutrals with one indigo and one red. Values live as shadcn custom properties in each page's stylesheet, under the names in the front matter. The `-dark` keys are what those names resolve to under `prefers-color-scheme: dark`.

### Neutral

- **Paper / Night Paper** (`background`): The page behind everything.
- **Ink / Night Ink** (`foreground`): The name, row values, figures.
- **Pencil** (`muted-foreground`): Row labels, group labels, idle messages. 5.5:1 on Paper, 6.9:1 on Night Paper.
- **Wash** (`muted`): A row or icon button under the pointer.
- **Rule** (`border`): Hairline dividers between groups, the outline of small buttons and the number box.
- **Off Track** (`input`): A switch that is off.

### Accent

- **Indigo** (`primary`, `ring`): A switch that is on, the filled part of the slider, the primary button, and the focus ring. Light `#3B5BDB` passes AA as text and behind white text; dark `#8DA2F5` is used behind dark ink. It is deliberately not LinkedIn's blue.

### Semantic

- **Failure Red** (`destructive`): Any failure: the message line, the tracker's expired sign-in, a failed unblock.

### Named Rules

**The On Rule.** Indigo marks state, not decoration. If something is indigo, it is switched on, it is the action that fixes a problem, or it has focus.

**The Red Means Failed Rule.** Red is only for something that failed. There is no success colour; a list that is working reads in plain ink.

**The Follow the System Rule.** `prefers-color-scheme` alone picks light or dark. There is no in-product switch.

## Typography

The platform's own UI font at 13px. No font is bundled.

### Hierarchy

- **Name** (600, 14px): "LinkedOut" in the header, once.
- **Body** (400, 13px): Row values, messages, buttons.
- **Group** (400, 12px, Pencil): The small label above each group of rows.
- **Figure** (600, 13px, tabular): The numbers in the readout, so they do not shift as they change.

### Named Rules

**The Label Column Rule.** Every row's label sits in a 104px column in Pencil, so values line up down the popup and read as a list.

**The Sentence Case Rule.** Labels and buttons are sentence case. Nothing is uppercase or letter-spaced.

## Layout

The popup is one column, 352px wide. The header and readout use a 12px inset; group rows span the full width with 12px inner padding, so their hover wash reaches the edges.

Top to bottom:

1. **Header.** The logo mark at 18px, the name, and a settings icon button at the far right.
2. **Readout.** One line of up to three figures with labels: Hidden here, Tracked, Blocked.
3. **Message line.** Shown only when there is something to say, under a hairline.
4. **Tracker problem.** Shown only when Google sign-in has expired or the sheet is missing, with the one action that fixes it.
5. **Hide from results.** Four rows, one per status.
6. **Applicant count.** The limit row and the slider row.
7. **Job tracker.** The sheet rows, or the connect row.

Height follows content. There is no height floor, because nothing in the popup opens outside its own flow.

The settings page is a separate tab: a 560px column, centred, with the same tokens and row style.

## Elevation & Depth

Flat. Structure comes from hairlines and the label column, never from shadows. The only lifted surface is the on-page Block panel, which floats over LinkedIn and needs a soft shadow to separate from the page.

## Shapes

6px corners on controls (rows, buttons, the number box), 10px on surfaces (the Block panel). Switches and the slider thumb are fully round. Icons are Lucide line icons at 16px.

## Components

### Header

The logo mark, `LinkedOut` in Name type, and a 28px ghost icon button with the Lucide `Settings` icon, named `Open settings`, which opens the settings page.

### Readout

One line: `Hidden here 12   Tracked 38   Blocked 7`. Labels in Pencil, figures in Figure type, 14px apart.

- **Hidden here** is the count of cards hidden on the current Jobs list. It reads `–` when there is no Jobs list or the page check failed.
- **Tracked** is the number of jobs added to the sheet, followed by `· N waiting` in Pencil when rows are waiting. It is left out when the tracker is not connected or not in the build.
- **Blocked** is the number of blocked companies. It is left out when the list cannot be read.

### Message Line

One line under a hairline, only when needed. Pencil for guidance and pauses ("Open a Jobs search to hide cards", "Reposted check paused by LinkedIn limits"). Failure Red for failures, each saying what failed and then how to recover ("Could not check this list. Reload the tab."). Failures take precedence in this order: a failed save, an unreadable blocklist, an unreadable hide choice, a failed page check. It is a live status region.

### Setting Row

The core component. A 28px row: label in the 104px column, value text, and a switch at the far right. The whole row is the switch's hit area and carries `role="switch"`. Hover fills the row with Wash; keyboard focus draws a 2px Indigo ring inside the row.

- **Hide rows.** Label is the status (Applied, Viewed, Saved, Reposted). Value is `Hidden` or `Shown`. Changing a row saves at once.
- **Limit row.** Label `Limit`, value `Hide over N` or `Off`.

### Switch

26px × 16px, fully round. Off: Off Track with a Paper knob. On: Indigo with the knob 10px to the right, over 150ms.

### Slider Row

Label `Max applicants`, a 4px track in Rule with the filled part in Indigo and a 14px round thumb outlined in Indigo, then a 56px number box with tabular digits. It moves through 13 stops from 10 to 2000. The row is at 50% opacity while the limit is off.

### Job Tracker Rows

- **Connected.** `Sheet` with the sheet's current name and a small `Open` button; `Status` with `N jobs added` (and `N waiting` when rows wait) and a small `Disconnect` button.
- **Not connected.** One row explaining the tracker, with a small primary `Connect Google Sheets` button.
- **Sheet missing.** `Status` reads `Sheet not found.` with a small primary `Create a new one` button.
- **Sign-in expired.** The tracker problem line at the top of the popup reads `Google sign-in expired.` in Failure Red with a small primary `Reconnect` button.

### Small Button

26px tall, 12px medium text, 6px corners. Outline by default (Rule border, Paper face). Primary is Indigo with its foreground.

### Settings Page

The blocked companies, newest first. A page title, one line of guidance in Pencil, then one 30px row per company divided by hairlines: the name, and a 28px ghost icon button with the Lucide `X`, named `Unblock <Company>`. Unblocking is immediate. The empty state is one Pencil line, "No blocked companies. Block one from a job card or the job details." A failed unblock shows one Failure Red line under the title and keeps the row. An unreadable list shows "Could not load blocked companies." and no rows.

### Block Control and Confirmation Panel

These render on the LinkedIn page, not in the popup. The card control and the job pane button keep their placement and shape, and draw in the page's current text colour. The confirmation panel lives in a shadow root and uses this system's tokens as literal values: Paper face, Rule border, 10px corners, a soft shadow, the title in 14px semibold, the body in Pencil, and `Cancel` (outline) and `Block` (Indigo) small buttons. It follows the colour scheme.

## Do's and Don'ts

### Do:

- **Do** read every colour from the custom properties, so both schemes follow.
- **Do** put new settings in a Setting Row under the right group.
- **Do** keep message text to one line at 352px.
- **Do** collapse motion under `prefers-reduced-motion: reduce`.

### Don't:

- **Don't** use Indigo for anything that is not on, a fix, or focus.
- **Don't** add a success colour, a banner, or a toast.
- **Don't** add shadows inside the popup or the settings page.
- **Don't** borrow LinkedIn's blue, pills, type or card style.
- **Don't** add dropdowns or menus to the popup; every daily control is one click.
