# Typography & Content Hierarchy Governance — M59

M59 establishes one semantic text-role system above the M58 token architecture. It does not perform host/module-wide migration.

## Authority

- Raw certified scale: `assets/css/foundation/tokens.css`
- M58 semantic token layer: `assets/css/foundation/token-architecture.css`
- M59 role mapping: `assets/css/foundation/typography-system.css`
- Product TypeScript contract: `src/design-system/typography-system.ts`
- React primitive integration: `src/design-system/primitives/typography.tsx`

## Rules

1. Visual typography role and semantic heading level are independent. Heading levels follow document structure.
2. M59 role values resolve only through certified M58 tokens.
3. Body/data content wraps by default. Truncation is explicit and may not hide meaning without an accessible full-value path.
4. Numeric data uses tabular lining figures; code uses the certified monospace family.
5. Role sizes remain rem-based and M59 introduces no viewport-specific font-size reduction. Breakpoint behavior belongs to M62.
6. Color hierarchy belongs to M60 and spacing/layout hierarchy belongs to M61.
7. Existing consumers remain valid until later controlled migration milestones.
