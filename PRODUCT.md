# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Active job seekers who use LinkedIn Jobs as a regular apply workflow.

## Product Purpose

Already-touched job cards (Applied, Viewed, and Saved) reappear in results and bury fresh roles. LinkedOut hides the statuses the seeker selects so those cards stop occupying the list. Success means toggling the options hides and restores the matching cards on a real Jobs search in the same session. Spam companies, staffing agencies, and recruiting agencies also crowd the list, so the seeker can block a company to remove its cards. Blocking is in progress.

## Positioning

LinkedIn keeps Applied, Viewed, and Saved cards in the results and only marks them. LinkedOut removes the selected cards from the main Jobs results list.

## Operating Context

The seeker browses LinkedIn’s main Jobs search results in Chrome while actively applying. They set which statuses to hide in the extension popup. Badge matching uses LinkedIn’s English labels. The choice persists across sessions. Cards that load later, from scrolling or filter changes, follow the same rules without a full reload.

## Capabilities and Constraints

A popup multi-select hides the selected English badges on the main Jobs results list, including cards that load later. Defaults: Applied and Viewed on, Saved off. Nothing selected shows every card.

Company blocking is in progress. A seeker will block a company from a job card or the job details, and its cards will disappear from the results list. The popup lists blocked companies and unblocks them. The popup section reads the stored list live, newest first, and each row's × unblocks that company at once. Each job card on a Jobs results list shows a `Block <Company>` control on hover or focus that opens a confirmation panel. Confirming only closes the panel. Storing the block, hiding the cards, and the job details button are not built yet. If the stored list cannot be read, the status line says so and the section shows no count and no empty state.

Firefox, other filters, apply tracking, other Jobs surfaces, and any backend are out of scope. Ghost-job signals, such as Promoted and Reposted, are a later, separate slice.

The shipped UI is the popup: the name, one status line, the hide dropdown with Applied, Viewed, and Saved, and the collapsible `Blocked companies (N)` section.

## Brand Commitments

The product name is LinkedOut. The popup uses the shadcn neutral system recorded in DESIGN.md. No voice or logo is binding.

## Evidence on Hand

The extension hides Applied cards on the main Jobs results list, and the popup turns that on and off. The extension also offers Viewed and Saved, and Saved is off by default. Badge matching for Viewed and Saved is tested against a local fixture only. The `/jobs/` home feed still shows Applied cards, because other Jobs surfaces are out of scope. The popup lists blocked companies and unblocks them, verified against the extension's own storage. The card control opens the confirmation panel, but confirming does not block a company yet, and the on-page unblock effect is untested until card hiding ships. The hide plan was GitHub issues #1–#5, and the company blocklist plan is #11–#16, on `ibizabroker/linkedout`.

Do not fabricate testimonials, usage numbers, or demonstrations of the hide behavior.

## Product Principles

- Fresh roles stay reachable by removing already-touched cards from the results list.
- The seeker chooses which of Applied, Viewed, and Saved disappear.
- Hide choices live in the popup. Blocking a company will happen on the page, where the company is in view. Hiding runs on the main Jobs results list.
- English LinkedIn badge labels are the match rule until a later decision.
- A company is blocked one at a time by its exact name. There is no built-in list of agencies.
- Scope past hiding and blocking stays undecided until it is explicitly chosen.
