# Application Shell & Navigation Architecture — M68

M68 consolidates the Work Management host shell and information-architecture contract without replacing the certified Shell M1–M8 implementation.

## Authority

- React shell owner: `src/app/shell/WorkManagementShell.tsx`
- Route/navigation markup authority: `assets/js/app.ts`
- Shell navigation presentation: `assets/css/shell-navigation.css`
- Shared shell client state: `assets/js/platform/state/client-state-store.ts`
- Route ownership/lifecycle remains the certified M40 authority.
- Global menus/overlays remain the M11/M14/M66 authorities.

## Information architecture

Primary destinations: Applications, Boards, Search, Users when authorized, Settings, Account when cloud mode is enabled.
Resource navigation is separate from primary destinations and contains Favorites, Applications, and Boards, with a search field scoped to application/board resources.

## Interaction model

Desktop supports expanded/compact navigation, persistent pin and width preferences, and transient unpinned peek. Mobile navigation is modal, marks the workspace inert, and restores focus through the existing runtime authority. Section expansion is persistent shell preference state; search, peek, resize, and mobile-open are transient shared client state.

## Accessibility

Active route/resource entries use `aria-current="page"`; sections expose `aria-expanded` plus `aria-controls`; the shell keeps a named navigation landmark, a skip link to `#main`, keyboard-operable resize separator, and polite navigation-state announcements.

## Boundaries

M68 does not rewrite route semantics, domain state, authorization, account-menu overlays, module navigation, or consumer screens. M69–M71 own subsequent presentation/motion systems and M72 owns controlled host UI migration.
