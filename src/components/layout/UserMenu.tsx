'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { LogOut, User, Mail } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getUserDisplayName } from '@/lib/utils/user';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils/cn';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface UserMenuProps {
  user: SupabaseUser;
  onSignOut: () => void | Promise<void>;
  onNavigate?: () => void;
}

const CLOSE_MS = 180;

export function UserMenu({ user, onSignOut, onNavigate }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: profile } = useProfile();

  const displayName = profile?.full_name ?? getUserDisplayName(user);
  const email = user.email ?? '';
  const metadata = user.user_metadata as { avatar_url?: string };
  const avatarUrl = profile?.avatar_url ?? metadata?.avatar_url;

  const closeMenu = useCallback(() => {
    if (!open || isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, CLOSE_MS);
  }, [open, isClosing]);

  const openMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(false);
    setOpen(true);
  };

  const toggleMenu = () => {
    if (open) closeMenu();
    else openMenu();
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeMenu]);

  const handleSignOut = async () => {
    closeMenu();
    onNavigate?.();
    await onSignOut();
  };

  const showPanel = open || isClosing;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${displayName}`}
        className={cn(
          'rounded-full p-0.5 transition-all duration-200',
          'ring-2 ring-primary/25 ring-offset-2 ring-offset-background',
          'hover:ring-primary/45 focus-visible:outline-none focus-visible:ring-primary/60',
          open && 'ring-primary/55'
        )}
      >
        <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" sizes="36px" />
          ) : (
            <User className="h-[18px] w-[18px] stroke-[2.25]" aria-hidden />
          )}
        </span>
      </button>

      {showPanel && (
        <div
          role="menu"
          aria-label="Account"
          className={cn(
            'absolute right-0 z-[60] mt-2 w-[min(100vw-2rem,18rem)] origin-top-right overflow-hidden rounded-xl',
            'border border-border bg-card shadow-xl shadow-black/15 dark:shadow-black/40',
            isClosing ? 'animate-user-menu-out' : 'animate-user-menu-in'
          )}
        >
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <p className="font-semibold text-foreground truncate" title={displayName}>
              {displayName}
            </p>
            {email && (
              <p
                className="mt-1 flex items-center gap-1.5 text-xs text-foreground/70 truncate"
                title={email}
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-foreground/50" aria-hidden />
                {email}
              </p>
            )}
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => setIsSignOutModalOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        description="Are you sure you want to sign out of your account? You will need to log in again to access your profile and orders."
        confirmText="Sign out"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
