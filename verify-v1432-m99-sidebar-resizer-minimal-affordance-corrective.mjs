import fs from 'node:fs';

const fail = (message) => { console.error(`M99 sidebar resizer minimal-affordance corrective verification FAILED: ${message}`); process.exit(1); };
const shellPath = 'src/app/shell/WorkManagementShell.tsx';
const specPath = 'tests/modern/e2e/m99-sidebar-interaction-containment.spec.mjs';
const shell = fs.readFileSync(shellPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');
const resizerMatch = shell.match(/<button type="button" className="shell-sidebar-resizer"[^>]*\/>/);
if (!resizerMatch) fail('sidebar resizer element missing');
const resizer = resizerMatch[0];
for (const required of ['data-shell-resizer', 'role="separator"', 'aria-label="Resize navigation"', 'aria-orientation="vertical"', 'aria-valuemin={224}', 'aria-valuemax={360}', 'aria-valuenow={shell.navigation.width}', 'aria-keyshortcuts="ArrowLeft ArrowRight Home End"']) {
  if (!resizer.includes(required)) fail(`required resize/accessibility contract missing: ${required}`);
}
if (resizer.includes('data-shell-tooltip')) fail('resize handle still exposes shell tooltip metadata');
if (shell.includes('Drag to resize. Arrow keys use 8px steps; Shift uses 24px.')) fail('deprecated resize instruction remains in shell source');
for (const required of ['resizer remains tooltip-free while horizontal drag resizing persists', "not.toHaveAttribute('data-shell-tooltip'", "page.locator('#wmShellTooltip')", 'page.mouse.down()', 'page.mouse.move(startX + 32', 'expect(after).toBeGreaterThan(before)', 'expect(Number(persisted)).toBe(after)']) {
  if (!spec.includes(required)) fail(`browser regression contract missing: ${required}`);
}
console.log('M99 sidebar resizer minimal-affordance corrective verification: PASS (tooltipRemoved=true; dragPreserved=true; keyboardAccessibilityPreserved=true)');
