import React from 'react'
import { cn } from '@/lib/utils'

interface MinecraftSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  error?: string
}

export function MinecraftSelect({
  label,
  options,
  error,
  className,
  ...props
}: MinecraftSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-foreground mb-2">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 border-4 border-minecraft-stone rounded-minecraft',
          'bg-white text-foreground cursor-pointer',
          'focus:outline-none focus:border-minecraft-grass focus:shadow-minecraft-md',
          'transition-all duration-75',
          'appearance-none',
          error && 'border-red-500 focus:border-red-600',
          className
        )}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-sm mt-1 font-bold">{error}</p>
      )}
    </div>
  )
}
