'use client'

import {useSyncExternalStore} from 'react'
import {Moon, Sun, Monitor} from 'lucide-react'
import {useTheme} from 'next-themes'
import {cn} from '@/lib/utils'
import {motion} from 'motion/react'
import {Tooltip} from '@/components/motion/tooltip'

// The theme of the server render is unknowable, so the toggle is gated on the
// first client render. useSyncExternalStore gives that hydration flag without
// a setState-in-effect cascade (and without rendering anything on the server).
const subscribeNever = () => () => {}

export function ThemeToggle() {
  const {theme, setTheme} = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )

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

      {/* Light */}
      <Tooltip content="Light" side="bottom">
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
      </Tooltip>

      {/* Dark */}
      <Tooltip content="Dark" side="bottom">
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
      </Tooltip>

      {/* System */}
      <Tooltip content="System" side="bottom">
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
      </Tooltip>
    </div>
  )
}
