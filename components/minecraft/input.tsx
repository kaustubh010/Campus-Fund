import React from 'react'
import { cn } from '@/lib/utils'

interface MinecraftInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function MinecraftInput({
  label,
  error,
  icon,
  className,
  ...props
}: MinecraftInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-foreground mb-2 pixel-font">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-muted-foreground">{icon}</div>}
        <input
          className={cn(
            'w-full px-3 py-2 border-4 border-minecraft-stone rounded-minecraft',
            'bg-white text-foreground',
            'focus:outline-none focus:border-minecraft-grass focus:shadow-minecraft-md',
            'transition-all duration-75',
            icon && 'pl-10',
            error && 'border-red-500 focus:border-red-600',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1 font-bold">{error}</p>
      )}
    </div>
  )
}
