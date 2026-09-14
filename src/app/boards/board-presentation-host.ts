export function resolveBoardPresentationHost(): HTMLElement {
  const host = document.querySelector<HTMLElement>('[data-wm-board-presentation-host]');
  if (!host) throw new Error('Work Management React Board presentation facade host is missing.');
  return host;
}
