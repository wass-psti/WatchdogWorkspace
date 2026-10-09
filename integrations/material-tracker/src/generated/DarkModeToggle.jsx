import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@material/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@material/components/ui/tooltip';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme, getTheme } from '@material/generated/utils/themeManager';

/**
 * Dark mode toggle button with smooth icon transition.
 */
export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => getTheme() === 'dark');

  // Sync with external theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(getTheme() === 'dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleToggle = useCallback(() => {
    const nowDark = toggleTheme();
    setIsDark(nowDark);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="size-8 rounded-lg hover:bg-primary/5 transition-colors duration-200"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className="relative size-4">
              <Sun className={`size-4 absolute inset-0 text-muted-foreground transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
              <Moon className={`size-4 absolute inset-0 text-muted-foreground transition-all duration-300 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isDark ? 'Light mode' : 'Dark mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
export default DarkModeToggle;
