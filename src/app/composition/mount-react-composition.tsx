import { createRoot, type Root } from 'react-dom/client';
import { ApplicationCompositionRoot } from './ApplicationCompositionRoot.tsx';

let compositionRoot: Root | null = null;
let compositionHost: HTMLElement | null = null;

export function mountReactComposition(host: HTMLElement): Root {
  if (compositionHost && compositionHost !== host) {
    throw new Error('Work Management React composition is already mounted in another host.');
  }
  if (compositionRoot) return compositionRoot;

  compositionHost = host;
  compositionRoot = createRoot(host, {
    identifierPrefix: 'wm-',
    onUncaughtError(error, errorInfo) {
      console.error('[Work Management] React composition uncaught error', error, errorInfo.componentStack);
    },
    onRecoverableError(error, errorInfo) {
      console.warn('[Work Management] React composition recoverable error', error, errorInfo.componentStack);
    },
  });
  compositionRoot.render(<ApplicationCompositionRoot />);
  return compositionRoot;
}
