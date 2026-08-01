'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-border/50 flex items-center justify-center relative overflow-hidden"
      aria-label="Changer de thème"
      title="Changer de thème"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-zinc-600 hover:text-zinc-900" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-zinc-400 hover:text-zinc-100" />
      <span className="sr-only">Changer de thème</span>
    </button>
  );
}
