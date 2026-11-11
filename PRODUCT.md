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

A popup multi-select hides the selected English badges on the main Jobs results list, including cards that load later. Defaults: Applied and Viewed on, Saved and Reposted off. Reposted is not a badge: LinkedIn's results list does not mark it, but its job-postings data does. With Reposted on, the extension asks LinkedIn about every job card on the list, for the jobs it has no fresh answer for, in one request per up to 25 jobs (`/voyager/api/voyagerJobsDashJobPostings`, from the seeker's own session). It waits about 0.3 seconds to collect cards, sends at most one request at a time and at most one every 1.5 seconds, so a page of about 25 cards costs one request. It hides a card only once LinkedIn says its job is reposted; a card whose job LinkedIn leaves out of the answer stays visible and is not asked about again until the page reloads. Each answer is cached in local storage for seven days (about 5000 jobs) with its applicant count and original listing time, and a cached job is not asked about again; hiding uses only the reposted flag. If the batch answer is not in the expected shape, the extension falls back for that page to fetching each job's own page (`/jobs/view/<id>/`) one at a time, about one a second, and reads `Reposted <n> <unit> ago` from it. If LinkedIn answers 429, 403, or a server error, or the network fails, checks stop for ten minutes (doubling to an hour while it keeps happening) and the status line says so. The applicant count is stored but not shown yet. Nothing selected and nothing blocked shows every card.

A seeker blocks a company from a job card or the job details, and its cards disappear from the results list the same way Applied, Viewed, and Saved cards do, including cards that load later, on open tabs at once and after a reload. Each job card on a Jobs results list shows a `Block <Company>` control on hover or focus that opens a confirmation panel. The job details pane shows an always visible `Block <Company>` button next to the top-card company name, which opens the same panel and follows the selected job. After a block the pane button becomes a disabled `Blocked` label and the pane stays on the same job. Confirming stores the block; if the store rejects it, the panel stays open and shows a failure line. The status line counts cards hidden for a badge or a blocked company together. The popup lists blocked companies, newest first, and each row's × unblocks that company at once, so its cards return on open tabs without a reload. Blocking is always on and does not depend on the hide choice being readable. If the stored list cannot be read, the status line says so, the section shows no count and no empty state, and no cards are hidden for the blocklist while badge hiding keeps working.

Firefox, other filters, apply tracking, other Jobs surfaces, and any backend are out of scope. Other ghost-job signals, such as Promoted and applicant counts, are a later, separate slice.

The shipped UI is the popup: the name, one status line, the hide dropdown with Applied, Viewed, Saved, and Reposted, and the collapsible `Blocked companies (N)` section.

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
