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
  window: '#FFFFFF'
  window-dark: '#232220'
typography:
  display:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: 'clamp(44px, 5.28vw, 76px)'
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: '-0.035em'
  page-title:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: 'clamp(36px, 5vw, 56px)'
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: '-0.03em'
  section-heading:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: 'clamp(26px, 2.8vw, 38px)'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '-0.02em'
  tally:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: 'clamp(17px, 1.52vw, 22px)'
    fontWeight: 500
    lineHeight: 1.3
  tally-phone:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '18px'
    fontWeight: 500
    lineHeight: 1.3
  detail-heading:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '24px'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.01em'
  prose-heading:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '20px'
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: '-0.01em'
  subheading:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '15px'
    fontWeight: 700
    lineHeight: 1.3
  site-body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif"
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.5
  brand:
    fontSize: '16px'
    fontWeight: 600
  key-site:
    fontSize: '13px'
    fontWeight: 500
  key-hero:
    fontSize: '16px'
    fontWeight: 600
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
  full: '999px'
spacing:
  inset: '12px'
  row: '28px'
  label-column: '104px'
  gutter: 'clamp(16px, 4.4vw, 64px)'
  content-max: '1440px'
  section-gap: '96px'
  section-gap-phone: '64px'
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
  key-site:
    height: '28px'
    padding: '0 11px'
    rounded: '{rounded.key}'
    backgroundColor: '{colors.key}'
    typography: '{typography.key-site}'
  key-medium:
    height: '32px'
    padding: '0 13px'
    rounded: '{rounded.key}'
    backgroundColor: '{colors.key}'
    typography: '{typography.key-site}'
  key-hero:
    height: '48px'
    padding: '0 22px'
    rounded: '{rounded.control}'
    backgroundColor: '{colors.key}'
    typography: '{typography.key-hero}'
  demo-window:
    rounded: '{rounded.surface}'
    backgroundColor: '{colors.window}'
    height: '540px'
  window-bar:
    height: '44px'
    padding: '0 14px'
    backgroundColor: '{colors.muted}'
  tab:
    height: '32px'
    padding: '0 14px'
    textColor: '{colors.muted-foreground}'
  tab-selected:
    backgroundColor: '{colors.window}'
    textColor: '{colors.foreground}'
  address-bar:
    padding: '5px 12px'
    rounded: '{rounded.full}'
    backgroundColor: '{colors.window}'
    textColor: '{colors.muted-foreground}'
  job-card:
    padding: '12px'
    rounded: '{rounded.control}'
  job-card-selected:
    backgroundColor: '{colors.muted}'
  job-monogram:
    size: '40px'
    rounded: '{rounded.control}'
    backgroundColor: '{colors.window}'
    textColor: '{colors.muted-foreground}'
  site-popup:
    width: '354px'
    rounded: '{rounded.surface}'
    backgroundColor: '{colors.background}'
  sheet-cell:
    height: '28px'
    padding: '0 10px'
  sheet-header:
    backgroundColor: '{colors.muted}'
    textColor: '{colors.muted-foreground}'
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

The website extends the same ledger to a page. It shows the product working rather than describing it: a headline, one tally line of figures between hairlines, then a browser frame holding a working copy of the Jobs list, the real popup, the Settings page and the tracker sheet. The site adds one bundled display face for headings and the tally, a larger key for its one call to action, and a soft lift under the frame and the popup. Everything else is the extension's paper, ink, pencil, rules and keys.

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
- **Window** (`window`): Website only. The face of the demo browser frame, its selected tab, the address bar, the job monograms and the sheet's status selects, one step whiter than Paper (Night: one step lighter) so the frame reads as a window on the page.

### Accent

- **Blue** (`primary`): `#0A66C2` in both schemes. It fills a switch that is on and the slider's filled part, and edges a key under the pointer.
- **Blue text** (`accent-text`, `ring`): Key icons, and the focus ring. `#0A66C2` on Paper; `#70B5F9` on Night Paper, where the fill blue is too dark to read.
- **Tint** (`tint`): The pale sweep across a key while its action runs. On the website, the wash a new sheet row arrives in.

### Semantic

- **Failure Red** (`destructive`): Any failure: the message line, the tracker's expired sign-in or missing sheet, a failed unblock.

### Named Rules

**The On Rule.** Blue marks state, not decoration. If something is blue, it is switched on, it is the action that fixes a problem, or it has focus.

**The Quiet Key Rule.** No button is solid blue. A key's face stays neutral; only its icon, and its edge under the pointer, turn blue.

**The Red Means Failed Rule.** Red is only for something that failed. There is no success colour; a list that is working reads in plain ink.

**The Follow the System Rule.** `prefers-color-scheme` alone picks light or dark. There is no in-product switch.

On the website these rules hold and extend as follows. Blue marks the result of what is switched on: in the tally line, `N still showing` is the only blue text on the homepage, and the 2px rule that strikes through each cleared figure is drawn in Blue text. The toolbar icon is ringed in Blue while the popup is open, and a pulsing Blue ring sits on the popup's Applied row until the visitor flips a switch, pointing at the fix. Keys keep a neutral face, including the large Add to Chrome key. Top bar and footer links are Pencil, turning Ink and underlined on hover; the only blue body link is a link inside the privacy page's prose. The site has no red because nothing on it can fail. The site reads the same colour scheme as the extension and has no switch.

## Typography

The extension (popup, Settings page, Block panel) uses the platform's own UI font at 13px, and bundles no font.

The website adds one display face, **Schibsted Grotesk**, self-hosted at weights 500, 700 and 800 (falling back to `system-ui`). It sets headings, the tally line and the job monograms. Body copy, nav, keys, cards, tabs and the sheet stay in the platform UI font at 15px on the page (`site-body`). The display face never appears inside the extension's own surfaces, including the real popup and Settings page shown in the demo frame.

### Hierarchy

- **Name** (600, 14px): "LinkedOut" in the header, once.
- **Body** (400, 13px): Row values and messages.
- **Group** (400, 12px, Pencil): The small label above each group of rows.
- **Figure** (600, 13px, tabular): The numbers in the readout, so they do not shift as they change.
- **Key** (500, 12px): Key labels.

Website, in the display face:

- **Display** (800, 44px to 76px fluid, 0.98, tight tracking): The homepage headline, once.
- **Page title** (800, 36px to 56px fluid): The privacy page's title.
- **Section heading** (700, 26px to 38px fluid): The open-source section's heading.
- **Tally** (500, 17px to 22px fluid; 18px on phones): The tally line. Labels in Pencil, figures in Ink at 700 with tabular digits.
- **Detail heading** (700, 24px): The job title in the demo's details pane.
- **Prose heading** (700, 20px): Section headings on the privacy page.
- **Subheading** (700, 15px): "About the job" in the details pane. The 40px job monograms use the face at 700, 13px.

Website, in the UI font: the brand name in the top bar and footer (600, 16px), site keys (500, 13px), the hero key (600, 16px), job card titles (600, 14px), card company (13px), card meta (12px, Pencil, tabular), tabs (500, 12.5px), the sheet (12.5px, tabular), and notes under the hero and demo (13px, Pencil).

### Named Rules

**The Label Column Rule.** Every row's label sits in a fixed column in Pencil (104px in the popup, 150px on the settings page), so values line up and read as a list.

**The Sentence Case Rule.** Labels and buttons are sentence case. Nothing is uppercase or letter-spaced. On the website the only uppercase text is the two-letter job monograms, which are initials.

**The Display Stays on the Site Rule.** Schibsted Grotesk is for website headings, the tally line and monograms. Body text, controls and every extension surface use the platform UI font.

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

The settings page is a separate tab, sized for reading rather than glancing: 15px body text and 20px pane titles. A 280px sidebar runs the full height of the tab's left edge with 16px padding on both sides, and the selected pane is a column capped near 760px, centred in the space to its right with at least 56px on each side. The tab itself never scrolls. The pane area scrolls, and its scrollbar appears only when the content is taller than the window, so the sidebar's hairline always runs top to bottom.

### Website

Content is capped at 1440px with a fluid side gutter (16px to 64px). Sections are separated by a hairline and 96px (64px on phones).

1. **Top bar.** The logo at 28px and the name in Brand type on the left; `Privacy` and `GitHub` links in Pencil on the right. 20px above and below.
2. **Hero band.** The headline on the left; on the right, bottom-aligned, the Add to Chrome hero key with a Pencil note under it.
3. **Tally line.** Between two hairlines, 14px inside them.
4. **Demo head.** A Pencil caption on the left and a neutral `Reset demo` key on the right.
5. **Demo frame.** Full content width, 540px body. The Jobs tab is a 420px card list beside the details pane, with the popup open over the right side under the toolbar icon; the details pane pads 394px on the right while the popup is open so nothing sits under it. The Settings tab holds the real Settings page; the Job Tracker tab holds the sheet.
6. **Open source.** A two-column band (5:6): the section heading left, a Pencil paragraph and a `View on GitHub` key right.
7. **Footer.** A hairline, then the brand and a row of Pencil links, then one Pencil note line.

The privacy page uses the same top bar and footer around a single prose column capped at 32em, 1.6 line height.

**Below 1280px** the details pane is dropped; the list takes the frame's width and pads 394px on the right while the popup is open.

**Phones (below 900px).** The frame dissolves: no border, corners, lift, traffic-light dots, address bar or toolbar icon. The tabs become a segmented strip in a Wash well with 10px corners, 38px tabs and short labels. The job list is its own box with 10px corners, capped at 372px tall with contained scrolling. Each card shows its Apply and Block keys under its text (also on any device without hover). The popup sits under the list, always open, centred at up to 354px, with no shadow. The Settings tab is 640px tall and the sheet 420px, each boxed with 10px corners. The hero stacks with its key under the headline, and the tally line puts one figure per line with no separators.

## Elevation & Depth

Flat. Structure comes from hairlines and the label column, never from shadows. Keys are 24px tall in the popup and 30px with 13px labels on the settings page. Keys get their depth from the heavier bottom edge, not a shadow. The search well is sunken with a 1px inner shadow. The only lifted surface in the extension is the on-page Block panel, which floats over LinkedIn and needs a soft shadow to separate from the page.

The website lifts exactly two things: the demo browser frame, and the popup inside it. Both are soft, long, negatively spread shadows tinted with Ink, which read as a window resting on paper rather than a card floating. Each has a darker dark-scheme value.

- **Window lift** (`0 18px 50px -24px`, Ink at 28%; black at 60% in dark): The demo frame.
- **Popup lift** (`0 16px 40px -18px`, Ink at 35%; black at 70% in dark): The popup over the Jobs list.

On phones both lifts are removed with the frame. Nothing else on the site has a shadow: keys keep their bottom edge, cards are flat with hairlines, and the toolbar icon's open state is a ring, not a lift.

**The Lifted Window Rule.** On the website only the demo frame and the popup in it lift. The page around them stays flat.

## Shapes

5px corners on keys, 6px on rows and the number box, 10px on surfaces (the Block panel, the settings frame). Switches, the slider thumb and the account initial are fully round. Icons are 14 to 16px line icons with a 2px stroke.

The website reuses the same steps: 10px on the demo frame, the popup and the phone boxes; 6px on cards, monograms, tabs' top corners, the toolbar icon and the hero key; 5px on keys and the sheet's selects. The address bar and the frame's three dots are fully round (999px). The hero key's icon is 18px.

## Motion

Motion is small and says what a control does. It runs on transform, opacity and stroke offsets, uses an ease-out curve, and stops under `prefers-reduced-motion: reduce`.

- **Settings gear.** Turns a quarter on hover, over 500ms.
- **Icon buttons.** Shrink to 90% while pressed. The × on a blocked company turns a quarter on hover.
- **Keys.** Lift 1px on hover, sink 1px on press.
- **Key icons.** Connect's links close and draw their middle bar. Disconnect's links part and show two break marks. New sheet's plus turns a quarter. The open-sheet arrow nudges up and right. Block's slash draws across the circle.
- **Busy key.** The label changes to the running verb (Connecting…, Creating…, Reconnecting…, Disconnecting…), the key is disabled, its edge turns blue, and a tint sweeps across its face from the left and holds near the end until the work finishes. The icon keeps moving: the plus spins, the link bar throbs.
- **Switch.** The knob slides 10px with a slight overshoot.

### Website

The site shares one curve, `cubic-bezier(0.16, 1, 0.3, 1)`, a fast start that settles. Every key and tab moves when pressed.

- **Key travel.** Site keys lift 1px and edge in Blue on hover (Pencil for neutral keys), sink 1px on press, over 120ms. A disabled key (an applied job's `Applied`) does not move.
- **Tabs.** A new tab rises 6px and fades in over 300ms when the demo opens it. A tab sinks 1px on press. The selected panel fades in over 180ms; the old one is removed at once, so the switch reads as a crossfade.
- **Popup drop.** On load the popup drops 12px from 97% scale over 350ms, anchored at its top right under the toolbar icon. Closing reverses to 8px and 97% over 200ms, then hides.
- **Card fold.** A hidden job card folds its height to nothing and fades over 300ms, and unfolds the same way when it returns.
- **Strike draw.** The tally line's strike draws left to right across a cleared figure over 400ms, and withdraws when it returns. The `still showing` figure counts to its new value over 400ms with an ease-out.
- **Hint.** The ring on the popup's Applied row pulses over 1.8s until the first switch is flipped.
- **New sheet row.** A row added to the sheet arrives in Tint and fades to the page over 1.6s.
- **Reduced motion.** Under `prefers-reduced-motion: reduce` every site animation and transition is removed and the count jumps straight to its value.

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

### Stats Strip

One line of Pencil text directly under the Status row, 28px tall, 12px from the left edge: `Today 3 · This week 11 · Last week 9`, with the numbers in Figure type. No arrows, no colour, no comparison marks. It is left out when the tracker is not connected and while LinkedOut has no copy of the sheet's dates.

### Bar Chart

A hand-drawn SVG that fills the pane's width, with no library and no legend. Two or three dashed Rule gridlines sit at round whole numbers with small Pencil labels at the left, above one hairline baseline. Bars have 3px rounded tops and are drawn in Pencil, and the current day or week is drawn in Ink so this week reads against the weeks before it. A dashed Blue line marks the average since the first application (per day on the daily chart, per week on the weekly chart, the same figure as the `Weekly average` row), labelled `avg 2.3` at its left end, with a whole number written without a decimal (`avg 7`), and is left out when the average is zero or above the top of the chart. Only the current bar, the tallest bar and any broken bar carry their figure. The axis labels are short dates in Pencil, one under each Monday on the daily chart and under every week on the weekly chart. All colour comes from the custom properties, so both schemes follow.

The scale is linear to a round top. When the tallest bar is above 20 and more than three times the second tallest, the top drops to 1.4 times the second tallest (never below 4) so ordinary days stay readable. Bars above it are drawn to the top, cut by two Paper-coloured diagonal strokes, with their real figure above them. There is no switch for the scale.

Hovering a bar's whole column, or focusing the chart, shows a small tooltip in Ink with Paper text above the bar: the figure in bold (`4 applied`), the bar's label, and `1.8× your average` or `20% below average` (left out when the average is zero). The other bars dim while one is shown, and the dimming fades in unless the reader prefers reduced motion. The chart is one tab stop. It starts on the current bar, the left and right arrow keys step between bars, and Escape or leaving the chart hides the tooltip. A ring in Blue-ring colour shows keyboard focus. The bars carry no native browser tooltip, so the custom one is the only hover label. The chart is named by an `aria-label`, and a visually hidden table with one row per bar, such as `Week of Nov 16` and `10 applications`, is its text alternative.

### Settings Page

A sidebar and one pane.

- **Sidebar.** The logo and `LinkedOut Settings` (the product's name for the page, so it is title case), then up to three items: `Blocked companies` with its count, `Stats` with no figure, and `Account` with `On`, `Off`, or `Needs you` in Failure Red. The selected item is drawn as a raised key. Stats and Account are left out in a build without Google settings.
- **Blocked companies.** A title, one line of guidance in Pencil, a sunken search well with a search icon and a `/` key hint (pressing `/` focuses it), then one 44px row per matching company, divided by hairlines: the name and an × icon button named `Unblock <Company>`. Unblocking is immediate. A search with no match reads `No blocked company matches "<text>".` The empty list reads "No blocked companies. Block one from a job card or the job details." A failed unblock shows one Failure Red line under the title and keeps the row. An unreadable list shows "Could not load blocked companies." and no rows.
- **Stats.** A title and one line of guidance, then four headline figures in a row (Today, This week, This month, All time: a Pencil label over the figure in 20px semibold with tabular digits), the two bar charts each under a small Pencil heading, and the bests as 44px rows with a 150px label column. A `Last updated …` line in Pencil sits above the figures only when the latest read failed and the saved numbers are on screen. Not connected, the pane shows one line of guidance with the `Connect Google Sheets` key at its right end.
- **Account.** A title and one line of guidance, then 48px rows with a 150px label column: `Google account` with the account and a neutral `Disconnect` key (and `Reconnect` before it when sign-in has expired), `Sheet` with its name and the Open sheet key, and `Jobs added` with the count. Not connected, the pane holds the `Google account` row with `Connect Google Sheets` at its right end. A Pencil line under the rows says what disconnecting does.

### Website Keys

The extension's Key at larger sizes. Same face, Rule border, heavier Key edge, Blue icon and travel.

- **Site key.** 28px tall, 11px sides, 13px label. `Reset demo` is a neutral site key.
- **Medium key.** 32px tall, 13px sides. The details pane's `Apply` and `Block <Company>`, and `View on GitHub`.
- **Hero key.** 48px tall, 22px sides, 6px corners, a 3px bottom edge, 16px semibold label, 18px icon. `Add to Chrome`, once per page.
- **Small key.** The popup's 24px key, used for `Apply` and `Block` on a job card.

### Tally Line

One line of figures in Tally type between hairlines, separated by middle dots: the total jobs, then applied, viewed, saved, reposted, from agencies, and over the limit when that applies, then `N still showing` in Blue text. Each figure is Ink at 700 with tabular digits, each label Pencil. When the demo hides a group, a 2px Blue rule draws through that figure at just above its midline; it stays readable. A screen reader hears one sentence with each cleared group said as cleared.

### Demo Frame

A browser window drawn in Ledger materials: Window face, Rule border, 10px corners, the window lift. Its 44px bar is Wash with a hairline beneath, holding three 10px Off Track dots, the tabs, the address bar and the toolbar icon.

- **Tabs.** 32px, 6px top corners, Pencil label in 12.5px. The selected tab takes the Window face and a Rule outline and sits 1px lower so it joins the page. Tabs appear as the demo opens them. Arrow keys, Home and End move between them.
- **Address bar.** A fully round Window pill with a Rule border and the current address in Pencil at 12px, truncated.
- **Toolbar icon.** The logo at 20px in a 30px square with 6px corners. Rule on hover. While the popup is open it carries a Blue ring set off by a Wash gap.

### Job Card

A row in the demo list: a 40px monogram box (Window face, Rule border, the company's initials in Pencil, display face) beside the title (600, 14px, Ink), the company (13px, Ink), a Pencil meta line (place · posted · applicants) and, when they apply, the status words in Pencil at 500. Cards are separated by hairlines. Hover washes the card faintly; the selected card is Wash. On desktop the `Block` key appears at the top right on hover or focus; on phones and touch devices `Apply` and `Block` sit under the text.

### Details Pane

The selected job: the title in Detail heading, the company in Pencil, then a fact list in the 104px label column (Location, Posted, Applicants) with Pencil labels, then the `Apply` and `Block <Company>` medium keys, then `About the job` in Subheading and Pencil lines capped at 62ch.

### Sheet Grid

The tracker sheet as a plain grid: 28px rows, 10px cell padding, hairlines on the right and bottom of each cell, 12.5px tabular text. The header row and the row-number column are Wash with Pencil text and stay put while the grid scrolls. The Status column holds a small select with a Rule border and 5px corners. An empty sheet shows one Pencil note in a Window box with 6px corners.

### Site Popup

The real popup, loaded in a frame inside a 354px Paper surface with a Rule border, 10px corners and the popup lift, hanging from the toolbar icon. It is the extension's popup unchanged.

### Top Bar and Footer

Shared by both pages. The top bar is the brand (logo and name) and Pencil text links. The footer opens with a hairline, then the brand and Pencil links (`Add to Chrome`, `GitHub`, `Privacy`, `Report an issue`), then a Pencil 13px note line. Links turn Ink and underline on hover; the current page's link is drawn that way too.

### Block Control and Confirmation Panel

These render on the LinkedIn page, not in the popup. The card control and the job pane button keep their placement and shape, and draw in the page's current text colour. The confirmation panel lives in a shadow root and uses this system's tokens as literal values: Paper face, Rule border, 10px corners, a soft shadow, the title in 14px semibold, the body in Pencil, a neutral `Cancel` key and a `Block` key with a ban icon. It follows the colour scheme.

## Do's and Don'ts

### Do:

- **Do** read every colour from the custom properties, so both schemes follow.
- **Do** put new settings in a Setting Row under the right group.
- **Do** put a row's action at its right end.
- **Do** keep message text to one line at 352px.
- **Do** give every key icon a motion that says its verb, and stop it under reduced motion.
- **Do** set website headings and the tally line in Schibsted Grotesk, and everything else on the site in the platform UI font.
- **Do** show the real popup and Settings page in the website's demo rather than redrawn copies.
- **Do** keep `still showing` the only blue text on the homepage, with the tally's strikes in the same blue.

### Don't:

- **Don't** fill a button with blue, or fill one blue on hover.
- **Don't** use blue for anything that is not on, a fix, or focus.
- **Don't** add a success colour, a banner, or a toast.
- **Don't** add goals, streaks, badges, arrows or colour to the stats.
- **Don't** add shadows inside the popup or the settings page.
- **Don't** borrow LinkedIn's pills, type or card style.
- **Don't** add dropdowns or menus to the popup; every daily control is one click.
- **Don't** use the display face inside the extension.
- **Don't** add a shadow on the website beyond the demo frame and the popup in it.
- **Don't** fill the Add to Chrome key with blue; it is a Key at hero size.
