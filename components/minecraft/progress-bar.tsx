import React from 'react'
import { cn } from '@/lib/utils'

interface MinecraftProgressBarProps {
  value: number
  max: number
  className?: string
  color?: 'grass' | 'gold' | 'diamond' | 'lapis'
  showLabel?: boolean
}

export function MinecraftProgressBar({
  value,
  max,
  className,
  color = 'grass',
  showLabel = true,
}: MinecraftProgressBarProps) {
  const percentage = (value / max) * 100
  
  const colorClasses = {
    grass: 'bg-minecraft-grass',
    gold: 'bg-minecraft-gold',
    diamond: 'bg-minecraft-diamond',
    lapis: 'bg-minecraft-lapis',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-minecraft-stone border-2 border-minecraft-stone-light rounded-minecraft overflow-hidden h-6 shadow-minecraft-sm">
        <div
          className={cn(
            'h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white',
            colorClasses[color]
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          {showLabel && percentage > 20 && (
            <span className="drop-shadow-lg">{Math.round(percentage)}%</span>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-muted-foreground flex justify-between">
          <span>${value.toLocaleString()}</span>
          <span>${max.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
