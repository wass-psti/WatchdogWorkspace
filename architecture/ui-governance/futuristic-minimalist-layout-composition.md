# Futuristic Minimalist Layout Composition — M82

M82 standardizes application-facing page, container, section, surface, grid, cluster, stack, responsive, and density composition without replacing the certified M61 spatial system, M62 breakpoint architecture, M79 semantic tokens, M80 shared primitives, or M81 application shell.

## Ownership hierarchy

1. M61 remains the spatial-token and base layout authority.
2. M62 remains the breakpoint/media-query authority.
3. M79 remains the semantic token/theme authority.
4. M80 remains the shared primitive authority.
5. M81 remains the application-shell and global-navigation authority.
6. M82 owns only composition profiles and the application-facing layout API.

## Responsive classes

- Mobile: through 40rem (M62 narrow authority).
- Tablet: above 40rem through 70rem (M62 tablet/laptop authority).
- Desktop: above 70rem (M62 laptop/wide authority).

Responsive behavior is explicit through grid/cluster profiles. M82 does not hide content implicitly and does not introduce JavaScript viewport-state ownership.

## Density

Density remains presentation state. `inherit` preserves the workspace preference; `compact` and `comfortable` use certified certified density tokens as explicit local composition overrides.

## CSS payload policy

M82 adds no new global stylesheet. It composes certified M61/M62 CSS and M79 density tokens, preserving the inherited M31 initial-CSS ceiling.
