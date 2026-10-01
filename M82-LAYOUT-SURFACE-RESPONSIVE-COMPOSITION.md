# M82 — Layout, Surface & Responsive Composition System

M82 introduces an application-facing composition layer over the certified M61/M62 layout and responsive primitives.

## Public composition primitives

- `WMPageLayout`
- `WMContentContainer`
- `WMSectionLayout`
- `WMSurfaceSection`
- `WMResponsiveGrid`
- `WMResponsiveCluster`
- `WMLayoutStack`

## Responsive profiles

- Grid: `single`, `split`, `dashboard`, `wideDashboard`
- Cluster: `inline`, `mobileStack`, `tabletStack`
- Device classes: mobile, tablet, desktop mapped to M62 breakpoints

## Density behavior

- `inherit`: no local override; workspace preference remains authoritative
- `compact`: uses certified compact density space
- `comfortable`: uses certified comfortable density space

No database, migration, auth/RBAC, persistence, route ownership, module business logic, or new global CSS payload is introduced.
