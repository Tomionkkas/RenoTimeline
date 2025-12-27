import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export interface MobileBottomNavProps {
  items: MobileNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  moreMenuItems?: MobileNavItem[];
  className?: string;
}

/**
 * Mobile bottom navigation bar component
 * Features:
 * - Fixed bottom positioning
 * - 44px minimum touch targets (WCAG 2.1 AAA)
 * - Glassmorphic effect with backdrop blur
 * - Safe area insets support for iOS notch
 * - Optional "More" menu for additional items
 */
export function MobileBottomNav({
  items,
  activeTab,
  onTabChange,
  moreMenuItems = [],
  className,
}: MobileBottomNavProps) {
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);

  const handleItemClick = (item: MobileNavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    onTabChange(item.id);
  };

  const handleMoreItemClick = (item: MobileNavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    onTabChange(item.id);
    setMoreMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-slate-900/80 backdrop-blur-xl border-t border-white/10',
        'shadow-lg shadow-black/20',
        // Safe area insets for iOS
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleItemClick(item)}
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'min-h-[44px] min-w-[44px] flex-1',
                'hover:bg-white/10 transition-colors',
                isActive && 'text-blue-400'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-blue-400')} />
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-blue-400' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </Button>
          );
        })}

        {moreMenuItems.length > 0 && (
          <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'flex flex-col items-center justify-center gap-1',
                  'min-h-[44px] min-w-[44px] flex-1',
                  'hover:bg-white/10 transition-colors',
                  moreMenuItems.some((item) => item.id === activeTab) &&
                    'text-blue-400'
                )}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-400">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>More Options</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? 'secondary' : 'ghost'}
                      onClick={() => handleMoreItemClick(item)}
                      className="w-full justify-start gap-3 h-14"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-base">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
