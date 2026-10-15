# M144.11 HF1 — Governed Board Import Bundle Budget

Historical M31/M95/M108 ceilings and provenance remain unchanged. This successor
applies only with the existing M108 governance source intact and the M143 wizard
source present. The ordinary Vite/manifest bundle analyzer still enforces every
individual JavaScript chunk, initial JavaScript, CSS, and total-build limit.

- M108 inherited ceiling: `6700000` bytes
- Measured PR #20 bundle: `6715228` bytes
- Measured overage: `15228` bytes
- Approved successor ceiling: `6750000` bytes
- Successor headroom: `34772` bytes
- Increase versus inherited ceiling: `50000` bytes

Rationale: the reviewed M141–M144 Board Import wizard adds legitimate frontend
functionality. The increase is limited to 50,000 bytes (0.75%) rather than
removing code or relaxing unrelated functionality. CI must still build and
measure actual output, and fail if the new ceiling or other budgets are exceeded.

Source: GitHub PR #20, first GitHub Actions run on 2026-10-14, Performance job
#115685006134. No Supabase deployment or database writes are authorized.
