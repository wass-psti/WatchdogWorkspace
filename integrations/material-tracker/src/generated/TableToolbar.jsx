import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@material/components/ui/badge';
import { Button } from '@material/components/ui/button';
import { Input } from '@material/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@material/components/ui/select';
import { Kbd } from '@material/components/ui/kbd';
import { Search, SlidersHorizontal, Package, AlertTriangle, FileDown, Loader2, Keyboard, FileSpreadsheet, FileText, AlignJustify, Building2, X } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@material/components/ui/tooltip';
import ColumnToggle from '@material/generated/ColumnToggle';
import FilterBookmarks from '@material/generated/components/FilterBookmarks';

export function TableToolbar({ onSearch, sourceFilter, onFilterChange, itemCount, loading,
  overdueOnly, onOverdueToggle, overdueCount, onVendorSearch, onExport, isExporting,
  onXlsxExport, isXlsxExporting, onCsvExport, cols, colVisibility, onColToggle, onBatchSetVis, density, onDensityToggle,
  isRefetching, sourceOptions, savedViews, onSaveView, onApplyView, onDeleteView }) {
  const [input, setInput] = useState('');
  const debounceRef = useRef(null);
  const handleInput = (val) => {
    setInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { debounceRef.current = null; onSearch(val); }, 400);
  };
  const clearSearch = () => { setInput(''); if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; } onSearch(''); };

  const [vendorInput, setVendorInput] = useState('');
  const vendorDebounceRef = useRef(null);
  const handleVendorInput = (val) => {
    setVendorInput(val);
    if (vendorDebounceRef.current) clearTimeout(vendorDebounceRef.current);
    vendorDebounceRef.current = setTimeout(() => { vendorDebounceRef.current = null; onVendorSearch?.(val); }, 400);
  };
  const clearVendor = () => { setVendorInput(''); if (vendorDebounceRef.current) { clearTimeout(vendorDebounceRef.current); vendorDebounceRef.current = null; } onVendorSearch?.(''); };
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); if (vendorDebounceRef.current) clearTimeout(vendorDebounceRef.current); }, []);

  // Track if filters are active
  const hasFilters = sourceFilter !== 'all' || input || vendorInput || overdueOnly;

  return (
    <div className="px-3 sm:px-5 py-3 flex flex-col gap-2.5 border-b border-border/40 bg-gradient-to-b from-muted/40 to-transparent relative">
      {/* Refetch progress indicator */}
      {isRefetching && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/10 overflow-hidden z-10">
          <div className="h-full w-1/4 bg-primary/60 rounded-full animate-progress-slide" />
        </div>
      )}

      {/* Row 1: Search + Source filter + Vendor */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 transition-colors duration-200 ${isRefetching ? 'text-primary/70' : ''}`} />
          <Input
            placeholder="Search materials..."
            value={input}
            onChange={e => handleInput(e.target.value)}
            className="pl-9 pr-8 h-9 rounded-lg bg-background border-border/50 shadow-sm text-sm focus-visible:ring-primary/30 transition-shadow duration-200"
          />
          {input.length > 0 && (
            <button onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer p-0.5"
              aria-label="Clear search">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Select value={sourceFilter} onValueChange={onFilterChange}>
          <SelectTrigger className={`w-[120px] sm:w-[130px] h-9 rounded-lg bg-background border-border/50 shadow-sm text-sm gap-1.5 transition-colors ${sourceFilter !== 'all' ? 'border-primary/40 ring-1 ring-primary/10' : ''}`}>
            <SlidersHorizontal className="size-3 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {(sourceOptions || ['Local', 'Import']).map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-[120px] max-w-[160px] hidden sm:block">
          <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Vendor..."
            value={vendorInput}
            onChange={e => handleVendorInput(e.target.value)}
            className="pl-8 pr-7 h-9 rounded-lg bg-background border-border/50 shadow-sm text-sm focus-visible:ring-primary/30 transition-shadow duration-200"
          />
          {vendorInput.length > 0 && (
            <button onClick={clearVendor}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer p-0.5"
              aria-label="Clear vendor">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          variant={overdueOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => onOverdueToggle(!overdueOnly)}
          className={`h-9 rounded-lg text-xs font-semibold gap-1.5 px-3 shrink-0 transition-all duration-200 ${overdueOnly ? 'shadow-sm' : ''}`}
        >
          <AlertTriangle className="size-3" />
          <span className="hidden sm:inline">Overdue</span>
          {overdueCount != null && overdueCount > 0 && (
            <span className={`text-[10px] font-bold rounded-full px-1.5 min-w-[18px] inline-flex items-center justify-center transition-colors ${overdueOnly ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-destructive/10 text-destructive'}`}>
              {overdueCount}
            </span>
          )}
        </Button>

        {/* Active filter indicator */}
        {hasFilters && (
          <Badge variant="secondary" className="rounded-full text-[10px] px-2 h-5 font-medium gap-1 shrink-0 hidden md:inline-flex">
            <span className="size-1.5 rounded-full bg-primary" />Filtered
          </Badge>
        )}

        <div className="flex-1 min-w-0" />

        {/* Desktop keyboard hints */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Keyboard className="size-3" />
                <Kbd className="text-[9px] px-1 py-0 h-4">⌘K</Kbd>
                <span>cmd</span>
                <Kbd className="text-[9px] px-1 py-0 h-4 ml-1">↑↓</Kbd>
                <span>nav</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>⌘K command palette, ↑↓ navigate rows, ? help</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Action buttons */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onDensityToggle}
                className="size-9 rounded-lg shrink-0 no-pdf transition-colors" aria-label="Toggle density">
                <AlignJustify className={`size-3.5 text-muted-foreground transition-opacity ${density === 'compact' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{density === 'compact' ? 'Comfortable view' : 'Compact view'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ColumnToggle cols={cols} visibility={colVisibility} onToggle={onColToggle} onBatchSet={onBatchSetVis} />
        <FilterBookmarks savedViews={savedViews} onSave={onSaveView} onApply={onApplyView} onDelete={onDeleteView} />

        <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}
          className="h-9 rounded-lg text-xs font-semibold gap-1.5 px-3 no-pdf shrink-0 hidden md:inline-flex transition-colors">
          {isExporting ? <Loader2 className="size-3 animate-spin" /> : <FileDown className="size-3" />}PDF
        </Button>
        <Button variant="outline" size="sm" onClick={onCsvExport}
          className="h-9 rounded-lg text-xs font-semibold gap-1.5 px-3 no-pdf shrink-0 hidden md:inline-flex transition-colors">
          <FileText className="size-3" />CSV
        </Button>
        <Button variant="outline" size="sm" onClick={onXlsxExport} disabled={isXlsxExporting}
          className="h-9 rounded-lg text-xs font-semibold gap-1.5 px-3 no-pdf shrink-0 hidden md:inline-flex transition-colors">
          {isXlsxExporting ? <Loader2 className="size-3 animate-spin" /> : <FileSpreadsheet className="size-3" />}Excel
        </Button>

        {!loading && itemCount > 0 && (
          <Badge variant="secondary" className="rounded-full text-[11px] px-2.5 h-6 font-semibold gap-1.5 shrink-0">
            <Package className="size-3" />{itemCount}
          </Badge>
        )}
      </div>

      {/* Row 2: Mobile-only vendor search + export buttons */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="relative flex-1">
          <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Vendor..."
            value={vendorInput}
            onChange={e => handleVendorInput(e.target.value)}
            className="pl-8 pr-7 h-9 rounded-lg bg-background border-border/50 shadow-sm text-sm"
          />
          {vendorInput.length > 0 && (
            <button onClick={clearVendor}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer"
              aria-label="Clear vendor">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={onExport} disabled={isExporting}
          className="size-9 rounded-lg shrink-0 no-pdf">
          {isExporting ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
        </Button>
        <Button variant="outline" size="icon" onClick={onCsvExport} className="size-9 rounded-lg shrink-0 no-pdf" aria-label="Export CSV">
          <FileText className="size-3.5" />
        </Button>
        <Button variant="outline" size="icon" onClick={onXlsxExport} disabled={isXlsxExporting}
          className="size-9 rounded-lg shrink-0 no-pdf" aria-label="Export Excel">
          {isXlsxExporting ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
export default TableToolbar;
