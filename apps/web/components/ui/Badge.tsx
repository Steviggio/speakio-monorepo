import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'destructive';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]",
    secondary: "border-transparent bg-[var(--color-bg-hover)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]/80",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    outline: "text-[var(--color-text)] border-[var(--color-border)]",
    success: "border-transparent bg-green-500 text-white hover:bg-green-600",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
