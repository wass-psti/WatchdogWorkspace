# M91 Dialog, Drawer, Overlay & Feedback Governance

## Ownership
- M63 remains accessibility/live-region authority.
- M66 remains dialog/menu/popover/tooltip, global overlay root, coordinator, focus lifecycle and topmost Escape authority.
- M67 remains persistent feedback and toast/announcement authority.
- M80 remains shared primitive composition authority.
- M81 remains shell/global-overlay presentation authority.

## M91 successor layer
M91 adds `WMDrawer`, `WMConfirmationDialog`, `WMNotificationStack`, an explicit overlay/feedback hierarchy contract, and responsive/forced-colors/reduced-motion presentation. These compositions remain controlled and do not own feature state or mutations.
