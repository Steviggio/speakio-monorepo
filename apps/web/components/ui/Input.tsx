import React, { useId } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const backupId = useId();
    const inputId = id || backupId;

    return (
      <div className="w-full space-y-1.5 flex flex-col items-start relative pb-5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)] ml-0.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          name={props.name || inputId}
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-3.5 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)]',
            error && 'border-red-400 focus:ring-red-400/30 focus:border-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 font-medium absolute bottom-0 left-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
