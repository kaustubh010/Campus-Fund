import React from 'react'
import { cn } from '@/lib/utils'

interface MinecraftCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'wood'
}

export function MinecraftCard({
  variant = 'default',
  className,
  children,
  ...props
}: MinecraftCardProps) {
  const variantClasses = {
    default: 'bg-[#2d3d2b] border-2 border-[#3d5a3b] text-[#a8d5a8]',
    dark: 'bg-[#1f3018] border-2 border-[#3d5a3b] text-[#a8d5a8]',
    wood: 'bg-[#354a32] border-2 border-[#3d5a3b] text-[#a8d5a8]',
  }

  return (
    <div
      className={cn(
        'p-4 transition-colors hover:border-[#6cd946]',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
