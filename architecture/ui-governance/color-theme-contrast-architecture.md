# M60 Color, Theme & Contrast Architecture

M60 owns semantic palette governance, theme-mode behavior, and measurable contrast requirements. It preserves the certified M59 typography system and does not own layout, responsive breakpoints, or component API migration.

## Theme modes

- `system` — follows the operating-system color-scheme preference.
- `light` — explicit light semantic palette.
- `dark` — explicit dark semantic palette.

The existing `preferences.v1` theme contract remains authoritative; M60 does not rename the preference key or change persistence behavior.

## Contrast policy

Normal semantic text pairs governed by M60 must meet at least 4.5:1. Focus indicators governed here must meet at least 3:1 against their adjacent surface. Disabled text is explicitly exempt from normal-text minimum contrast, but must remain identifiable through state semantics rather than color alone.

M60 corrects two light-palette failures present in the M59 baseline: tertiary text and accent foreground contrast. All required pairs are checked deterministically from the actual CSS values.

## Boundaries

- M61 owns layout/grid/spatial behavior.
- M62 owns responsive/breakpoint behavior.
- M63 owns broader accessibility interaction semantics.
- M64 owns component consolidation.
