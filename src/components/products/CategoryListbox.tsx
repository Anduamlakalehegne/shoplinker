'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CategoryListboxProps {
  categories: string[];
  selectedCategory: string | undefined;
  onChange: (category: string | undefined) => void;
}

export function CategoryListbox({ categories, selectedCategory, onChange }: CategoryListboxProps) {
  const labelId = useId();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () => [
      { value: undefined as string | undefined, label: 'All Categories' },
      ...categories.map((c) => ({
        value: c,
        label: c.charAt(0).toUpperCase() + c.slice(1),
      })),
    ],
    [categories]
  );

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === selectedCategory);
    return idx >= 0 ? idx : 0;
  }, [options, selectedCategory]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt) return;
      onChange(opt.value);
      close();
    },
    [close, onChange, options]
  );

  useEffect(() => {
    if (open) {
      // Defer to avoid synchronous setState-in-effect lint violation
      Promise.resolve().then(() => setActiveIndex(selectedIndex));
    }
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const node = e.target as Node;
      if (triggerRef.current?.contains(node) || listRef.current?.contains(node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        close();
      }
      return;
    }

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(selectedIndex);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectIndex(activeIndex);
        break;
      default:
        break;
    }
  };

  const displayLabel = options[selectedIndex]?.label ?? 'All Categories';

  return (
    <div className="w-full sm:w-[200px] transition-all duration-300">
      <span id={labelId} className="mb-2 block text-sm font-medium text-foreground">
        Category
      </span>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={labelId}
          aria-activedescendant={open ? `${listboxId}-opt-${activeIndex}` : undefined}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={handleTriggerKeyDown}
          className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background transition-all"
        >
          <span>{displayLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>

        {open && (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-lg shadow-primary/10 animate-in fade-in zoom-in-95"
          >
            {options.map((opt, index) => {
              const isSelected = opt.value === selectedCategory;
              const isActive = index === activeIndex;
              return (
                <div
                  key={opt.value ?? '__all__'}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectIndex(index)}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
                    isActive
                      ? 'bg-primary/15 text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    isSelected && 'font-medium text-foreground'
                  )}
                >
                  {isSelected && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-primary">
                      <Check className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                  {opt.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
