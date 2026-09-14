# Stage C M11 Global Overlays Activation Runbook

Milestone 11 requires the certified M10 React Shell baseline.

## Governed certification entrypoint

Do **not** begin M11 certification with a raw ambient `npm ci`. The repository intentionally enforces Node 22 / npm 10 with `engine-strict=true`, so an unrelated host Node/npm version must never be used for dependency restoration.

Run the shell-level entrypoint instead:

```bash
bash scripts/certify-stage-c-m11.sh
```

The entrypoint enters the governed Node `22.16.0` / npm `10.9.2` toolchain **before** running `npm ci`, then executes:

1. exact lockfile dependency installation;
2. M10 React Shell verification;
3. M11 Global Overlays verification;
4. strict TypeScript verification;
5. complete historical UI verification;
6. Vite dev browser ownership verification;
7. production build, dist and preview verification;
8. complete Stage C release certification; and
9. final M4–M11 status reporting.

A toolchain-only preflight is available without dependency installation:

```bash
bash scripts/certify-stage-c-m11.sh --toolchain-check
```

A successful promotion ends with:

```text
Stage C platform certification: PASS
M10 React Shell: active-certified
M11 Global Overlays: active-certified
```

No Supabase migration is required.
