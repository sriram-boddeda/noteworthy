'use client'

import React, {useState, useEffect} from 'react'
import {Moon, Sun, Monitor} from 'lucide-react'
import {useTheme} from 'next-themes'
import {cn} from '@/lib/utils'
import {motion} from 'framer-motion'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'

export function ThemeToggle() {
  const {theme, setTheme} = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // compute x-offset for each slot (8px padding + 32px step)
  const slotOffset = theme === 'light' ? 0 : theme === 'dark' ? 32 : 64

  return (
    <div className="relative flex items-center rounded-full p-1 bg-muted">
      <motion.div
        initial={false}
        animate={{
          x: slotOffset,
          // keyframe borderRadius to get that “squishy” blob effect
          borderRadius: ['50%', '40% 60% 60% 40%', '50%'],
        }}
        transition={{
          x: {type: 'spring', stiffness: 700, damping: 30},
          borderRadius: {
            duration: 0.8,
            times: [0, 0.5, 1],
            ease: 'easeInOut',
          },
        }}
        className="absolute h-8 w-8 bg-background shadow-md"
      />

      <TooltipProvider delayDuration={0}>
        {/* Light */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme('light')}
              className="relative z-10 p-2 rounded-full"
              aria-label="Set light theme"
            >
              <Sun
                className={cn(
                  'h-4 w-4 transition-colors',
                  theme === 'light' ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10}>
            Light
          </TooltipContent>
        </Tooltip>

        {/* Dark */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme('dark')}
              className="relative z-10 p-2 rounded-full"
              aria-label="Set dark theme"
            >
              <Moon
                className={cn(
                  'h-4 w-4 transition-colors',
                  theme === 'dark' ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10}>
            Dark
          </TooltipContent>
        </Tooltip>

        {/* System */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme('system')}
              className="relative z-10 p-2 rounded-full"
              aria-label="Set system theme"
            >
              <Monitor
                className={cn(
                  'h-4 w-4 transition-colors',
                  theme === 'system' ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10}>
            System
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
