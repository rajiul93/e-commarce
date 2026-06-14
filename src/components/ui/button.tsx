import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
  secondary: 'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100',
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
