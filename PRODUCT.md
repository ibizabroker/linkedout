# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Active job seekers who use LinkedIn Jobs as a regular apply workflow.

## Product Purpose

Already-touched job cards (Applied, Viewed, and Saved) reappear in results and bury fresh roles. LinkedOut hides the statuses the seeker selects so those cards stop occupying the list. Success means toggling the options hides and restores the matching cards on a real Jobs search in the same session.

## Positioning

LinkedIn keeps Applied, Viewed, and Saved cards in the results and only marks them. LinkedOut removes the selected cards from the main Jobs results list.

## Operating Context

The seeker browses LinkedIn’s main Jobs search results in Chrome while actively applying. They set which statuses to hide in the extension popup. Badge matching uses LinkedIn’s English labels. The choice persists across sessions. Cards that load later, from scrolling or filter changes, follow the same rules without a full reload.

## Capabilities and Constraints

v1 mechanism: a popup multi-select hides the selected English badges on the main Jobs results list, including cards that load later. Defaults: Applied and Viewed on, Saved off. Nothing selected shows every card.

v1 excludes Firefox, on-page controls, other filters, apply tracking, other Jobs surfaces, and any backend.

Anything beyond that hide behavior is undecided for now.

The shipped UI is still the WXT starter popup.

## Brand Commitments

The product name is LinkedOut. No voice, logo, or visual system is binding.

## Evidence on Hand

The extension scaffold is a popup counter, a content script that runs on Google, and an empty background script. No LinkedIn hiding behavior exists in the product yet. The implementation plan is GitHub issues #1–#5 on `ibizabroker/linkedout`.

Do not fabricate testimonials, usage numbers, or demonstrations of the hide behavior.

## Product Principles

- Fresh roles stay reachable by removing already-touched cards from the results list.
- The seeker chooses which of Applied, Viewed, and Saved disappear.
- v1 control lives in the popup, and v1 hiding runs on the main Jobs results list.
- English LinkedIn badge labels are the match rule until a later decision.
- Scope past hiding stays undecided until it is explicitly chosen.
