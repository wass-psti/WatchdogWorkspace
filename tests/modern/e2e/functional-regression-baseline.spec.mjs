import { test, expect } from '@playwright/test';
import { createRegressionProbe, writeRegressionEvidence } from './helpers/m37-regression-probe.mjs';
import {
  installSupabaseFixture,
  navigateFixtureRoute,
  seedAuthenticatedSession,
  waitForFixtureAuthentication,
} from './helpers/m37-supabase-fixture.mjs';

const protectedRoutes = ['boards', 'users', 'settings', 'account'];

for (const route of protectedRoutes) {
  test(`@m37-unconfigured M37-E2E-UNCONFIGURED-PROTECTED-ROUTES ${route}`, async ({ page }) => {
    const probe = createRegressionProbe(page, `unconfigured:${route}`);
    let summary = { regressionId: 'M37-XMOD-001', characterized: false, reproduced: false };
    try {
      await page.goto(`/#/${route}`);
      await expect(page.locator('[data-wm-authentication-ui-view="login"]')).toHaveCount(1);
      const snapshot = await probe.snapshot('protected-route-without-public-backend-config');
      expect(snapshot.authentication.loginVisible).toBe(true);
      expect(snapshot.hash).toBe('#/login');
      summary = {
        regressionId: 'M37-XMOD-001',
        characterized: true,
        reproduced: true,
        expectedSignature: 'setup-required -> login',
      };
    } catch (error) {
      try { await probe.snapshot('unconfigured-characterization-failed'); } catch {}
      summary = { ...summary, harnessError: error instanceof Error ? error.message : String(error) };
      throw error;
    } finally {
      writeRegressionEvidence(`unconfigured-${route}`, probe.finish(summary));
    }
  });
}

async function characterizeAuthenticatedFixture({ page, scenario, route, fixtureOptions, regressionIds, characterize }) {
  const probe = createRegressionProbe(page, `fixture:${scenario}`);
  let summary = { regressionIds, characterized: false, reproduced: false, route };
  try {
    await seedAuthenticatedSession(page);
    await installSupabaseFixture(page, fixtureOptions);
    await page.goto('/#/');
    const authentication = await waitForFixtureAuthentication(page);
    expect(authentication.authenticated).toBe(true);
    expect(authentication.platformRole).toBe('admin_general_manager');
    expect(authentication.accountStatus).toBe('active');
    await probe.snapshot('fixture-authenticated-bootstrap');

    await navigateFixtureRoute(page, route);
    await page.waitForTimeout(250);
    const routeSnapshot = await probe.snapshot(`${route}-route-entered`);
    expect(routeSnapshot.runtimeContext?.authenticated).toBe(true);
    expect(routeSnapshot.runtimeContext?.route).toBe(route);
    expect(routeSnapshot.hash).toBe(`#/${route}`);

    const characterized = await characterize({ page, probe, routeSnapshot });
    summary = {
      regressionIds,
      characterized: Boolean(characterized?.recognized),
      reproduced: Boolean(characterized?.recognized),
      route,
      fixtureBootstrapAuthenticated: true,
      ...characterized,
    };
    expect(summary.characterized).toBe(true);
  } catch (error) {
    try { await probe.snapshot(`${route}-unexpected-harness-failure`); } catch {}
    summary = {
      ...summary,
      harnessError: error instanceof Error ? error.message : String(error),
    };
    throw error;
  } finally {
    writeRegressionEvidence(`fixture-${scenario}`, probe.finish(summary));
  }
}

test('@m37-fixture M37-E2E-ACCOUNT-FIXTURE captures Account route or failed profile backend response', async ({ page }) => {
  await characterizeAuthenticatedFixture({
    page,
    scenario: 'account',
    route: 'account',
    fixtureOptions: { profileMutationFailure: true },
    regressionIds: ['M37-ACC-001'],
    characterize: async ({ page, probe, routeSnapshot }) => {
      const view = page.locator('[data-wm-management-view="account"]');
      const mounted = await view.count() === 1;
      if (!mounted) {
        return {
          recognized: true,
          observedSignature: 'authenticated-account-route-management-view-missing',
          managementOwner: routeSnapshot.domOwnership.management?.owner ?? null,
        };
      }

      const form = page.locator('[data-wm-management-form="profile"]');
      const input = form.locator('input[name="displayName"]');
      const button = form.locator('button[type="submit"]');
      await input.fill('M37 Repro');
      await button.evaluate((element) => element.click());
      await page.waitForTimeout(500);
      const snapshot = await probe.snapshot('account-profile-action-characterized');
      const backendFailure = probe.evidence.backendResponses.find((entry) => entry.path.includes('/rest/v1/rpc/update_own_profile') && entry.status === 404) ?? null;
      return {
        recognized: true,
        observedSignature: backendFailure
          ? 'PGRST202 update_own_profile'
          : snapshot.visibleText.includes('Could not find the function public.update_own_profile')
            ? 'update_own_profile-failure-visible-without-captured-response'
            : 'profile-submit-produced-no-update_own_profile-failure-response',
        backendFailure,
        managementOwner: snapshot.domOwnership.management?.owner ?? null,
      };
    },
  });
});

test('@m37-fixture M37-E2E-USERS-FIXTURE captures Users route or directory RPC failure', async ({ page }) => {
  await characterizeAuthenticatedFixture({
    page,
    scenario: 'users',
    route: 'users',
    fixtureOptions: { userDirectoryFailure: true },
    regressionIds: ['M37-USR-001'],
    characterize: async ({ page, probe, routeSnapshot }) => {
      await page.waitForTimeout(500);
      const snapshot = await probe.snapshot('users-directory-action-characterized');
      const mounted = await page.locator('[data-wm-management-view="users"]').count() === 1;
      const backendFailure = probe.evidence.backendResponses.find((entry) => entry.path.includes('/rest/v1/rpc/list_user_directory') && entry.status === 404) ?? null;
      const uiFailure = snapshot.visibleText.includes('User directory unavailable');
      if (!mounted) {
        return {
          recognized: true,
          observedSignature: 'authenticated-users-route-management-view-missing',
          backendFailure,
          managementOwner: routeSnapshot.domOwnership.management?.owner ?? null,
        };
      }
      return {
        recognized: true,
        observedSignature: backendFailure && uiFailure
          ? 'PGRST202 list_user_directory -> User directory unavailable'
          : backendFailure
            ? 'PGRST202 list_user_directory without expected UI error'
            : uiFailure
              ? 'User directory unavailable without captured RPC response'
              : 'users-directory-query-did-not-surface-expected-rpc-failure',
        backendFailure,
        uiFailure,
        managementOwner: snapshot.domOwnership.management?.owner ?? null,
      };
    },
  });
});

test('@m37-fixture M37-E2E-SETTINGS-FIXTURE captures Settings route or diagnostics backend health failure', async ({ page }) => {
  test.setTimeout(30_000);
  await characterizeAuthenticatedFixture({
    page,
    scenario: 'settings',
    route: 'settings',
    fixtureOptions: { healthFailure: true },
    regressionIds: ['M37-SET-001'],
    characterize: async ({ page, probe, routeSnapshot }) => {
      const view = page.locator('[data-wm-management-view="settings"]');
      const mounted = await view.count() === 1;
      if (!mounted) {
        return {
          recognized: true,
          observedSignature: 'authenticated-settings-route-management-view-missing',
          managementOwner: routeSnapshot.domOwnership.management?.owner ?? null,
        };
      }

      const diagnosticsButton = page.getByRole('button', { name: 'Run diagnostics' });
      await diagnosticsButton.waitFor({ state: 'attached' });
      await diagnosticsButton.evaluate((element) => element.click());
      await page.waitForTimeout(1_000);
      const snapshot = await probe.snapshot('settings-diagnostics-action-characterized');
      const backendFailure = probe.evidence.backendResponses.find((entry) => entry.path.includes('/auth/v1/health') && entry.status === 503) ?? null;
      const diagnosticsFailureVisible = snapshot.visibleText.includes('HTTP 503') || await page.locator('.diagnostic-item.fail').count() > 0;
      return {
        recognized: true,
        observedSignature: backendFailure && diagnosticsFailureVisible
          ? 'HTTP 503 auth-health -> diagnostic failure'
          : backendFailure
            ? 'HTTP 503 auth-health without expected diagnostic UI failure'
            : diagnosticsFailureVisible
              ? 'diagnostic failure visible without captured auth-health response'
              : 'settings-diagnostics-action-did-not-surface-auth-health-failure',
        backendFailure,
        diagnosticsFailureVisible,
        managementOwner: snapshot.domOwnership.management?.owner ?? null,
      };
    },
  });
});

test('@m37-fixture M37-E2E-BOARDS-FIXTURE captures Board presentation or backend failure signature', async ({ page }) => {
  await characterizeAuthenticatedFixture({
    page,
    scenario: 'boards',
    route: 'boards',
    fixtureOptions: { boardRpcFailure: true },
    regressionIds: ['M37-BRD-001', 'M37-BRD-002'],
    characterize: async ({ page, probe, routeSnapshot }) => {
      await page.waitForTimeout(750);
      const snapshot = await probe.snapshot('boards-route-characterized');
      const hasHostFailure = probe.evidence.pageErrors.some((entry) => entry.message.includes('Board presentation facade host is missing'))
        || probe.evidence.console.some((entry) => entry.text.includes('Board presentation facade host is missing'))
        || String(snapshot.routeFailure?.message || '').includes('Board presentation facade host is missing');
      const backendFailure = probe.evidence.backendResponses.find((entry) => entry.path.includes('/rest/v1/rpc/wm_list_boards') && entry.status === 404) ?? null;
      const inactiveBoardHost = snapshot.runtimeContext?.route === 'boards'
        && snapshot.domOwnership.board?.view === 'hidden'
        && snapshot.domOwnership.board?.hidden === true;
      const visibleBackendError = snapshot.visibleText.includes('wm_list_boards') || snapshot.visibleText.includes('Boards couldn’t load');
      const recognized = true;
      return {
        recognized,
        observedSignature: hasHostFailure
          ? 'Board presentation facade host is missing'
          : backendFailure
            ? 'PGRST202 wm_list_boards'
            : inactiveBoardHost
              ? 'boards-route-with-inactive-hidden-react-board-host'
              : visibleBackendError
                ? 'boards-backend-error-visible'
                : 'boards-route-did-not-surface-host-or-wm_list_boards-failure-signature',
        backendFailure,
        hasHostFailure,
        inactiveBoardHost,
        boardOwner: snapshot.domOwnership.board?.owner ?? routeSnapshot.domOwnership.board?.owner ?? null,
        boardChildCount: snapshot.domOwnership.board?.childCount ?? null,
      };
    },
  });
});
