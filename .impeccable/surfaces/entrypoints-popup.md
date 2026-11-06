---
version: 1
slug: "entrypoints-popup"
primary_target: "entrypoints/popup"
related_targets: []
---

# Popup

Mode: Operate

The seeker is mid-search. The popup sets which statuses disappear and shows whether this Jobs list changed. This slice ships Applied and Viewed.

## Direction contract

THESIS: This popup is the hide control for the current Jobs list. It refuses the starter counter and a separate control for each status.

OWN-WORLD: shadcn. A neutral extension panel, the name, one status line, and one dropdown of checkable items.

STORY: The seeker reads whether this list is hiding cards, then turns Applied and Viewed on or off. The choice persists.

FIRST VIEWPORT: The name LinkedOut, then the status line, then the label Hide from results above a closed dropdown that reads the selected options, such as Applied, Viewed, or Nothing hidden. The label is there because the options alone have no verb. The menu is two checkboxes, Applied and Viewed. Those checkboxes are the action.

FORM: User-pinned shadcn. It was not a rolled candidate. seed:a1b4443e5c9341af (hand dealt, unused; form pinned by the user)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
