# M42 Self-Role FormData Corrective

## Verified failure boundary

The target-Mac browser run showed that the self-demotion test clicked Save but `admin_set_user_access` was never observed (`userMutationCalls` remained 0).

## Root cause

The Users form intentionally disables the Status control for the current administrator to prevent self-disable. HTML `FormData(form)` omits disabled controls. The submit handler previously converted the missing Status entry to an empty string and rejected it before invoking the protected RBAC mutation RPC.

## Correction

The React Users submit handler now falls back to the authoritative current directory record for fields omitted because they are disabled/protected:

- platform role: submitted value, otherwise current `platform_role`
- account status: submitted value, otherwise current `status`

Normal validation remains in place after fallback. Editable controls still use their submitted values. This allows an authorized self-role change while keeping self-disable prohibited.

## Browser contract strengthening

The self-role Playwright scenario now explicitly verifies before Save that:

- the disabled Status control remains `active`;
- the editable Role control actually changes to `supervisor`;
- Save is enabled.

The existing post-click contract then verifies mutation dispatch, backend state/revision change, post-mutation access refresh, assignment identity consistency, identity publication, and shell-owned authorization denial.

## Certification state

Implementation is complete pending the full target-Mac fail-closed certification sequence. No PASS or certified baseline is claimed by this corrective record.
