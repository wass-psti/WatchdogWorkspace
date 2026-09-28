# Layout, Grid & Spatial System — M61

M61 converts the certified spacing scale into explicit spatial intent without redesigning existing product surfaces. `assets/css/foundation/layout-system.css` is the canonical semantic spatial authority; it aliases only previously certified variables.

## Ownership
- **M61:** static spacing semantics, content-width semantics, composable Stack/Cluster/Grid/Page/Section/Container behavior.
- **M62:** viewport/breakpoint adaptation and responsive primitive behavior.
- **M72–M76:** controlled adoption across host, Boards, and embedded modules.

## Compatibility rules
Existing primitive defaults must remain visually equivalent. Shell, Boards, and module-local geometry remain live compatibility authorities until their migration milestones. No compatibility rule is removable without zero-consumer evidence and historical regression coverage.

## Grid policy
M61 supports explicit static one-, two-, and three-column grids. It deliberately does not make those column counts responsive; M62 owns adaptive collapse behavior.
