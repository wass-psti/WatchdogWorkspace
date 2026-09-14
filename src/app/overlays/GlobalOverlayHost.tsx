import { SharedApplicationOverlayLayer, SharedApplicationToastLayer } from '../shared-ui/SharedApplicationUI.tsx';

/**
 * Stage C M11 global overlay host, extended by M14 shared application UI.
 *
 * React owns the page-lifetime portal roots. M14 also gives React ownership of
 * command-palette, global toast, and application-update presentation inside
 * those roots while other compatibility overlays may still use the M11 runtime.
 */
export function GlobalOverlayHost() {
  return (
    <div
      className="wm-global-overlay-host"
      data-wm-global-overlay-host=""
      data-wm-composition-owner="react-global-overlays"
    >
      <div
        data-wm-shared-application-ui-host=""
        data-wm-shared-application-ui-owner="react-command-palette-shared-ui"
      >
        <div id="overlayRoot" data-wm-global-overlay-layer="interactive">
          <SharedApplicationOverlayLayer />
        </div>
        <div
          id="toastRoot"
          className="toast-root"
          data-wm-global-overlay-layer="toast"
          aria-live="polite"
          aria-atomic="true"
        >
          <SharedApplicationToastLayer />
        </div>
      </div>
    </div>
  );
}
