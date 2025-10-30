import * as React from 'react';
import { cn } from '@/lib/utils';

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          'bg-pink-600 text-white hover:bg-pink-700',
          'h-10 py-2 px-4',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

const ButtonVariant = {
  default: 'bg-pink-600 text-white hover:bg-pink-700',
  outline: 'bg-transparent border border-gray-300 hover:bg-gray-50',
  ghost: 'bg-transparent hover:bg-gray-100',
} as const;

type ButtonVariant = keyof typeof ButtonVariant;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}

export { Button, ButtonVariant };
export type { ButtonProps };
