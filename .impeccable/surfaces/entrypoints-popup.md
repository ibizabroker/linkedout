---
version: 1
slug: "entrypoints-popup"
primary_target: "entrypoints/popup"
related_targets: []
---

# Popup

Mode: Operate

The seeker is mid-search. The popup sets which statuses disappear and shows whether this Jobs list changed. It ships Applied, Viewed, and Saved, and a collapsible list of blocked companies, read live from storage, with an × on each row to unblock it.

## Direction contract

THESIS: This popup is the hide control for the current Jobs list, and the place to review and undo company blocks. It refuses the starter counter and a separate control for each status.

OWN-WORLD: shadcn. A neutral extension panel, the name, one status line, one dropdown of checkable items, and one collapsible list.

STORY: The seeker reads whether this list is hiding cards, then turns Applied, Viewed, and Saved on or off. Saved starts off. The choice persists. Below that, the seeker opens Blocked companies to see who is blocked and unblock a company with its ×.

FIRST VIEWPORT: The name LinkedOut, then the status line, then the label Hide from results above a closed dropdown that reads the selected options, such as Applied, Viewed, or Nothing hidden. The label is there because the options alone have no verb. The menu is three checkboxes, Applied, Viewed, and Saved. Those checkboxes are the action. Below the dropdown, a collapsed header reads Blocked companies (N). Expanded and empty, it reads No blocked companies. Block one from a job card or the job details.

FORM: User-pinned shadcn. It was not a rolled candidate. seed:a1b4443e5c9341af (hand dealt, unused; form pinned by the user)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
