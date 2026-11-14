# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Active job seekers who use LinkedIn Jobs as a regular apply workflow.

## Product Purpose

Already-touched job cards (Applied, Viewed, and Saved) and reposted jobs reappear in results and bury fresh roles. LinkedOut hides the statuses the seeker selects so those cards stop occupying the list. Success means toggling the options hides and restores the matching cards on a real Jobs search in the same session. Spam companies, staffing agencies, and recruiting agencies also crowd the list, so the seeker can block a company to remove its cards.

## Positioning

LinkedIn keeps Applied, Viewed, and Saved cards in the results and only marks them. LinkedOut removes the selected cards from the main Jobs results list.

## Operating Context

The seeker browses LinkedIn’s main Jobs search results in Chrome while actively applying. They set which statuses to hide in the extension popup. Badge matching uses LinkedIn’s English labels. The choice persists across sessions. Cards that load later, from scrolling or filter changes, follow the same rules without a full reload.

## Capabilities and Constraints

A popup multi-select hides the selected English badges on the main Jobs results list, including cards that load later. Defaults: Applied and Viewed on, Saved and Reposted off. Reposted is not a badge: LinkedIn's results list does not mark it, but its job-postings data does. With Reposted on, the extension asks LinkedIn about the job cards on the list directly, on every page load: one request per up to 25 listed jobs it has not yet asked about this page (`/voyager/api/voyagerJobsDashJobPostings`, from the seeker's own session), sent as soon as the cards appear and again for cards that load later. Answers live in memory for that page only; nothing on this path is cached, so a reload asks again. It hides a card only once LinkedIn says its job is reposted; a card whose job LinkedIn leaves out of the answer stays visible and is not asked about again until the page reloads. If LinkedIn answers 403 or a server error, or the answer is not in the expected shape, the extension falls back for that page to fetching each job's own page (`/jobs/view/<id>/`) one at a time, about one a second, and reads `Reposted <n> <unit> ago` from it. Only this fallback uses the cache: its answers are saved in local storage for seven days (about 5000 jobs), and a cached job is not downloaded again. If LinkedIn answers 429 or 999, or the network fails, on either path, checks stop for ten minutes (doubling to an hour while it keeps happening), with no fallback, and the status line says so. The applicant count and original listing time arrive with each answer and are held in memory. Nothing selected, no applicant limit, and nothing blocked shows every card.

A separate `Hide by applicant count` control below the Hide menu (a checkbox, a slider, and a number box) hides jobs with more than the chosen number of applicants. It is off by default and starts at 100 when first turned on. The slider moves through 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, and 2000; the number box takes any whole number from 1 to 2000, and a value between stops shows the nearest stop. A limit of 200 hides 201 or more and keeps exactly 200. The count comes from the same job-postings answer as Reposted, so the request runs when either Reposted or the count filter is on, it works on free accounts (which see only "Over 100 applicants" on the job itself), and it adds no requests. A job whose count LinkedIn leaves out stays visible. Cards follow the slider while it is dragged, without saving; the value is saved when the slider is released or the number box is left or confirmed with Enter. In the per-job fallback, the job page's `N applicants` or `N people clicked apply` gives an exact count and `Over 100 applicants` or `Over 100 people clicked apply` hides a job only when the limit is below 100. Cached fallback counts are trusted for 24 hours (repost answers stay for seven days); with the filter on, an older entry's job page is downloaded again through the same spaced queue. If the stored limit cannot be read, the filter is treated as off and the other hiding keeps working. The status line's single count includes cards hidden for their applicant count.

A seeker blocks a company from a job card or the job details, and its cards disappear from the results list the same way Applied, Viewed, and Saved cards do, including cards that load later, on open tabs at once and after a reload. Each job card on a Jobs results list shows a `Block <Company>` control on hover or focus that opens a confirmation panel. The job details pane shows an always visible `Block <Company>` button next to the top-card company name, which opens the same panel and follows the selected job. After a block the pane button becomes a disabled `Blocked` label and the pane stays on the same job. Confirming stores the block; if the store rejects it, the panel stays open and shows a failure line. The status line counts cards hidden for a badge or a blocked company together. The popup lists blocked companies, newest first, and each row's × unblocks that company at once, so its cards return on open tabs without a reload. Blocking is always on and does not depend on the hide choice being readable. If the stored list cannot be read, the status line says so, the section shows no count and no empty state, and no cards are hidden for the blocklist while badge hiding keeps working.

A `Job tracker` section below the blocked companies connects a Google account with Chrome's sign-in and creates a Google Sheet called LinkedOut Job Tracker in the seeker's Drive. It asks only for `drive.file`, so it reaches files LinkedOut created and nothing else. Disconnect revokes the sign-in and forgets the sheet without deleting it, reconnecting reuses the existing sheet, and a sheet that was deleted or trashed shows `Sheet not found.` with a button to create a new one. The section needs a Google client ID and a fixed extension key from a local `.env`, and is hidden in a build without them. Writing applications into the sheet is a later slice.

Firefox, other filters, other Jobs surfaces, and any backend are out of scope. Other ghost-job signals, such as Promoted, very old listings, and closed jobs, are a later, separate slice.

The shipped UI is the popup: the name, one status line, the hide dropdown with Applied, Viewed, Saved, and Reposted, the `Hide by applicant count` control, the collapsible `Blocked companies (N)` section, and the `Job tracker` section when the build has Google settings.

## Brand Commitments

The product name is LinkedOut. The popup uses the shadcn neutral system recorded in DESIGN.md. No voice or logo is binding.

## Evidence on Hand

The extension hides Applied cards on the main Jobs results list, and the popup turns that on and off. The extension also offers Viewed and Saved, and Saved is off by default. Badge matching for Viewed and Saved is tested against a local fixture only. The `/jobs/` home feed still shows Applied cards, because other Jobs surfaces are out of scope. The popup lists blocked companies and unblocks them, verified against the extension's own storage. Blocking from a card and from the pane, the cards disappearing and returning on unblock without a reload, persistence across a reload, and the hidden count on the popup's report channel were verified on a live logged-in Jobs search. The toolbar popup itself was not opened over that page, so the combined status text rests on the unit tests. The hide plan was GitHub issues #1–#5, and the company blocklist plan is #11–#16, on `ibizabroker/linkedout`.

Do not fabricate testimonials, usage numbers, or demonstrations of the hide behavior.

## Product Principles

- Fresh roles stay reachable by removing already-touched cards from the results list.
- The seeker chooses which of Applied, Viewed, and Saved disappear.
- Hide choices live in the popup. Blocking a company happens on the page, where the company is in view. Hiding runs on the main Jobs results list.
- English LinkedIn badge labels are the match rule until a later decision.
- A company is blocked one at a time by its exact name. There is no built-in list of agencies.
- Scope past hiding and blocking stays undecided until it is explicitly chosen.
