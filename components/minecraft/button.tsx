import React from 'react'
import { cn } from '@/lib/utils'

interface MinecraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function MinecraftButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading,
  disabled,
  ...props
}: MinecraftButtonProps) {
  const variantClasses = {
    primary: 'bg-minecraft-grass hover:bg-minecraft-grass-light text-white border-b-4 border-minecraft-dirt hover:border-minecraft-dirt-light',
    secondary: 'bg-minecraft-stone hover:bg-minecraft-stone-light text-white border-b-4 border-obsidian',
    accent: 'bg-minecraft-gold hover:bg-minecraft-gold-dark text-black border-b-4 border-minecraft-gold-dark',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-700',
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'font-bold rounded-minecraft transition-all duration-75 active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed',
        'shadow-minecraft-md hover:shadow-minecraft-lg',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  )
}
