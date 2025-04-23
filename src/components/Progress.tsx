import React from 'react'
import { cn } from '../lib/utils' // helper to merge classNames (or just use clsx if you prefer)

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  color?: 'purple' | 'red' | 'green' | 'blue' // extend as needed
}

const getColorClass = (color: string) => {
  switch (color) {
    case 'red':
      return 'bg-red-500'
    case 'green':
      return 'bg-green-500'
    case 'blue':
      return 'bg-blue-500'
    case 'purple':
    default:
      return 'bg-purple-500'
  }
}

export const Progress = ({ value, className, color = 'purple', ...props }: ProgressProps) => {
  return (
    <div
      className={cn(
        'relative h-3 w-full overflow-hidden rounded-full bg-white/10 shadow-inner border border-white/10',
        className,
      )}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-in-out rounded-full', getColorClass(color))}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
