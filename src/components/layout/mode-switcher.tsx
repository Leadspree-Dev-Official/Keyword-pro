'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { websiteConfig } from '@/config/website';
import { Check, LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

/**
 * Mode switcher component, used in the navbar
 */
export function ModeSwitcher() {
  if (!websiteConfig.ui.mode?.enableSwitch) {
    return null;
  }

  const { theme, setTheme } = useTheme();
  const t = useTranslations('Common.mode');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-full cursor-pointer transition-colors relative flex items-center justify-center"
          title="Toggle light/dark theme"
        >
          <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 bg-popover border-border shadow-lg">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2">
            <SunIcon className="size-3.5" />
            <span>{t('light')}</span>
          </div>
          {theme === 'light' && <Check className="size-3 text-[#0062ff]" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2">
            <MoonIcon className="size-3.5" />
            <span>{t('dark')}</span>
          </div>
          {theme === 'dark' && <Check className="size-3 text-[#0062ff]" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2">
            <LaptopIcon className="size-3.5" />
            <span>{t('system')}</span>
          </div>
          {theme === 'system' && <Check className="size-3 text-[#0062ff]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
