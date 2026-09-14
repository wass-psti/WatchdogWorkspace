# M30 Modern Testing Toolchain Compatibility Hotfix

## Trigger

The first governed M30 certification run reached the executable Vitest gate but npm rejected `jsdom@30.0.1` under Node 22.16.0 with `EBADENGINE`. The application, Docker runtime, browser discovery, package-lock provenance, M29 schema provenance, and M30 static verifier had already passed.

## Root cause

M30 selected jsdom 30.0.1 without reconciling its raised Node engine floor with the long-standing governed Node 22.16.0 baseline. jsdom 30 requires a later Node 22 minor and therefore cannot be bootstrapped under `engine-strict=true`.

## Correction

- Keep governed Node 22.16.0 and npm 10.9.2 unchanged.
- Replace jsdom 30.0.1 with exact `jsdom@27.4.0`.
- Require jsdom 27.4.0's published engine contract: `^20.19.0 || ^22.12.0 || >=24.0.0`.
- Verify the installed jsdom package exposes that exact engine contract before tests run.
- Preserve M29 `package-lock.json` and `supabase/schema.sql` byte-for-byte.
- Do not weaken Vitest, coverage, Playwright, pgTAP, CDP, build, or release gates.

## Certification state

The corrective RC remains `implementation-complete-pending-certification` until the governed release sequence executes successfully and promotes M30 to `active-certified`.
