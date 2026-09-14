# Stage C M12 Authentication UI — Activation Runbook

M12 must be certified from the release-certified M11 governed-bootstrap baseline. The package is intentionally shipped in `implementation-complete-pending-certification` and only the complete release workflow may promote it to `active-certified`.

Do **not** begin M12 certification with a raw ambient `npm ci`. The local shell may be Node 24/npm 11 while the governed project toolchain is Node `22.16.0` / npm `10.9.2` with strict engines.

Use the shell-level entrypoint:

```bash
bash scripts/certify-stage-c-m12.sh --toolchain-check
bash scripts/certify-stage-c-m12.sh
```

The workflow enters the governed toolchain before dependency installation, performs a clean `npm ci`, checks M10/M11/M12 architecture, strict TypeScript, focused authentication regressions, the complete UI chain, real Vite login-route ownership, production build/dist/preview, and then the complete Stage C release certification.

Expected final state:

```text
Stage C platform certification: PASS
M10 React Shell: active-certified
M11 Global Overlays: active-certified
M12 Authentication UI: active-certified
```

Final M12 status must include:

```text
M12 activation state: active-certified
M12 React authentication UI architecture is release-certified.
```
