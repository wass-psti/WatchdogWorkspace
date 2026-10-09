import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@material/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@material/components/ui/tooltip';
import { RefreshCw, Check } from 'lucide-react';

function getTimeAgo(date) {
  if (!date) return null;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function SyncIndicator({ isRefreshing, lastRefreshed, onRefresh }) {
  const [showCheck, setShowCheck] = useState(false);
  const [timeAgo, setTimeAgo] = useState(() => getTimeAgo(lastRefreshed));
  // P2 Fix: Track whether the user manually triggered a refresh
  const userInitiatedRef = useRef(false);
  const wasRefreshingRef = useRef(false);

  // Show success checkmark only after user-initiated refresh completes
  useEffect(() => {
    if (isRefreshing) {
      wasRefreshingRef.current = true;
    } else if (wasRefreshingRef.current && lastRefreshed && userInitiatedRef.current) {
      wasRefreshingRef.current = false;
      userInitiatedRef.current = false;
      setShowCheck(true);
      const t = setTimeout(() => setShowCheck(false), 2000);
      return () => clearTimeout(t);
    } else {
      wasRefreshingRef.current = false;
    }
  }, [isRefreshing, lastRefreshed]);

  // Update time display periodically
  useEffect(() => {
    setTimeAgo(getTimeAgo(lastRefreshed));
    const interval = setInterval(() => setTimeAgo(getTimeAgo(lastRefreshed)), 10000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  const handleClick = useCallback(() => {
    userInitiatedRef.current = true;
    onRefresh?.();
  }, [onRefresh]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            {timeAgo && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline tabular-nums transition-opacity duration-200">
                {timeAgo}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClick}
              disabled={isRefreshing}
              className="size-8 rounded-lg transition-all duration-200 hover:bg-primary/5"
              aria-label="Refresh data"
            >
              {showCheck && !isRefreshing ? (
                <Check className="size-3.5 text-[hsl(var(--chart-2))] animate-success-pop" />
              ) : (
                <RefreshCw className={`size-3.5 text-muted-foreground transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'hover:rotate-45'}`} />
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isRefreshing ? 'Refreshing…' : timeAgo ? `Updated ${timeAgo}` : 'Refresh data'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SyncIndicator;
