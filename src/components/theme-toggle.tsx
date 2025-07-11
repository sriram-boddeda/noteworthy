
'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="relative flex items-center rounded-full p-1 bg-muted">
      <div
        className={cn(
          'absolute h-8 w-8 rounded-full bg-background shadow-md transition-transform duration-300 ease-in-out',
          theme === 'light' && 'transform translate-x-0',
          theme === 'dark' && 'transform translate-x-8',
          theme === 'system' && 'transform translate-x-16'
        )}
      />
       <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={() => setTheme('light')}
                    className="relative z-10 p-2 rounded-full"
                    aria-label="Set light theme"
                >
                    <Sun className={cn(
                        "h-4 w-4 transition-colors",
                        theme === 'light' ? 'text-primary' : 'text-muted-foreground'
                    )} />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
                Light
            </TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={() => setTheme('dark')}
                    className="relative z-10 p-2 rounded-full"
                    aria-label="Set dark theme"
                >
                    <Moon className={cn(
                        "h-4 w-4 transition-colors",
                        theme === 'dark' ? 'text-primary' : 'text-muted-foreground'
                    )} />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>
                Dark
            </TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                 <button
                    onClick={() => setTheme('system')}
                    className="relative z-10 p-2 rounded-full"
                    aria-label="Set system theme"
                >
                    <Monitor className={cn(
                        "h-4 w-4 transition-colors",
                        theme === 'system' ? 'text-primary' : 'text-muted-foreground'
                    )} />
                </button>
            </TooltipTrigger>
             <TooltipContent side="bottom" sideOffset={10}>
                System
            </TooltipContent>
        </Tooltip>
       </TooltipProvider>
    </div>
  );
}
