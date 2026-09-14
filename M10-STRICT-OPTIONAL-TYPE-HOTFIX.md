# Stage C M10 — Strict Optional Type Hotfix

## Scope

This hotfix addresses the single release-certification blocker found by the governed TypeScript gate for Stage C Milestone 10.

## Root cause

`LegacyApplicationBoundaryProps` intentionally declares `className?: string` while the project enables `exactOptionalPropertyTypes`. Under that compiler mode, an optional property means the property may be omitted; it does not permit an explicitly supplied `undefined` value unless `undefined` is part of the property type.

`WorkManagementShell.tsx` passed `className={... : undefined}` when the authenticated shell was inactive, producing TS2375.

## Correction

The caller now omits the `className` property entirely when the React shell is inactive by using a conditional JSX spread. The component contract remains strict and unchanged.

## Architectural impact

None. React remains the persistent shell owner, the legacy route-content boundary remains page-lifetime stable, and all M10 compatibility boundaries remain unchanged.

## Database impact

None. No Supabase migration is required.
