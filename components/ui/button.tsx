import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                className={cn(
                    'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-slate-900 text-white hover:bg-slate-800 shadow': variant === 'default',
                        'bg-red-600 text-white hover:bg-red-700 shadow': variant === 'destructive',
                        'border border-slate-200 bg-white hover:bg-slate-50': variant === 'outline',
                        'hover:bg-slate-100': variant === 'ghost',
                        'underline-offset-4 hover:underline text-slate-900': variant === 'link',
                        'h-10 px-4 py-2': size === 'default',
                        'h-9 px-3': size === 'sm',
                        'h-11 px-8': size === 'lg',
                        'h-10 w-10': size === 'icon',
                    },
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'

export { Button }
