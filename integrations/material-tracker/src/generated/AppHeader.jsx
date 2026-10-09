import React from 'react';
import { Layers } from 'lucide-react';
import SyncIndicator from '@material/generated/SyncIndicator';
import DarkModeToggle from '@material/generated/DarkModeToggle';
import PresenceIndicator from '@material/generated/components/PresenceIndicator';

export function AppHeader({ embedded = false, isRefreshing, lastRefreshed, onRefresh, pageLoading, compressed, otherUsers }) {
  return (
    <header className={`border-b border-border bg-card relative transition-all duration-300 ease-out ${compressed ? 'sticky top-0 z-50 backdrop-blur-md bg-card/95 shadow-sm' : ''}`}>
      <div className={`px-4 sm:px-6 md:px-10 max-w-[1440px] mx-auto transition-all duration-300 ease-out ${compressed ? 'py-2' : 'py-5 sm:py-6'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`flex items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 shrink-0 ${compressed ? 'size-7' : 'size-9 sm:size-10'}`}>
              <Layers className={`text-primary transition-all duration-300 ${compressed ? 'size-3.5' : 'size-4 sm:size-5'}`} />
            </div>
            <div className="min-w-0">
              <h1 className={`font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)] transition-all duration-300 truncate ${compressed ? 'text-sm' : 'text-lg sm:text-xl md:text-2xl'}`}>
                Material Sourcing
              </h1>
              <p className={`text-xs sm:text-sm text-muted-foreground overflow-hidden transition-all duration-300 ${compressed ? 'max-h-0 opacity-0 mt-0' : 'max-h-6 opacity-100 mt-0.5'}`}>
                Procurement tracking & cost management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PresenceIndicator users={otherUsers} />
            {!embedded && <DarkModeToggle />}
            <SyncIndicator isRefreshing={isRefreshing} lastRefreshed={lastRefreshed} onRefresh={onRefresh} />
          </div>
        </div>
      </div>
      {/* Animated gradient accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(var(--chart-5))] to-primary animate-gradient-shift transition-opacity duration-500 ${compressed ? 'opacity-30' : 'opacity-100'}`} />
      {/* Page loading progress bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden transition-opacity duration-300 z-[1] ${pageLoading ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-full w-2/5 bg-primary/80 rounded-full animate-progress-slide" />
      </div>
    </header>
  );
}
export default AppHeader;
