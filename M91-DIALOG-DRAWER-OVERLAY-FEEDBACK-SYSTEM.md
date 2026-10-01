# M91 — Dialog, Drawer, Overlay & Feedback System

M91 is a Stage-I successor composition layer over the certified M63 accessibility, M66 overlay, M67 feedback, M80 shared-primitives, and M81 shell-overlay authorities.

It adds shared `WMDrawer`, `WMConfirmationDialog`, and `WMNotificationStack` compositions plus a unified overlay/feedback system contract and responsive presentation layer. Existing Ark dialog/menu/popover focus, ARIA, Escape and dismissal semantics remain authoritative; global root-branch exclusivity remains owned by the page-lifetime overlay runtime/coordinator; feedback announcements and toast compatibility remain M67/M14-owned.

M91 does not create new product state, authorization, persistence, backend, schema, migration, or feature mutation semantics.
