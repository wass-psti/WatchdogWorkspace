# M4/M5 Governance Recovery Hotfix

This corrective continuation resolves a forward-compatibility defect between Milestone 4 recovery governance and Milestone 5 workflow extensions.

- `npm run governance:restore` is missing-files-only and never overwrites an existing `.github` workflow or dotfile.
- M4 corrective verification checks required M4 workflow contracts rather than complete byte identity.
- Recovery workflow templates contain the current M5 `interactions:check` extension.
- Later milestones may add additional gates without invalidating M4 so long as the M4-required gates remain present.
