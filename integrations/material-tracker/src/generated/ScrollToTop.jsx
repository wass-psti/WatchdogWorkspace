import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@material/components/ui/button';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop({ hasBulkBar }) {
  const [visible, setVisible] = useState(false);

  // P2 Fix: Always listen to window scroll since the table container is horizontal-only.
  // The vertical scrolling happens on the window/page level.
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!visible || hasBulkBar) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollUp}
      className="fixed bottom-6 right-6 z-20 size-10 rounded-full shadow-lg border-primary/20 bg-card hover:bg-primary/5 hover:border-primary/40 hover:shadow-xl no-pdf animate-fade-scale-in transition-all duration-200"
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-4 text-primary" />
    </Button>
  );
}
export default ScrollToTop;
