'use client';

type Props = {
  quantity: number;
  max?: number;
  disabled?: boolean;
  loading?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'xs' | 'sm' | 'md';
};

const sizeStyles = {
  xs: {
    root: 'h-9 rounded-lg text-sm',
    btn: 'min-w-[2.25rem] px-2.5',
    qty: 'min-w-[2rem] px-1.5 text-sm',
  },
  sm: {
    root: 'h-10 rounded-lg text-base',
    btn: 'min-w-[2.5rem] px-3',
    qty: 'min-w-[2.25rem] px-2 text-sm',
  },
  md: {
    root: 'h-11 rounded-xl text-lg',
    btn: 'min-w-[2.75rem] px-3.5',
    qty: 'min-w-[2.5rem] px-2 text-base',
  },
} as const;

export function CartQuantityControls({
  quantity,
  max,
  disabled = false,
  loading = false,
  size = 'md',
  onIncrement,
  onDecrement,
}: Props) {
  const atMax = max !== undefined && quantity >= max;
  const styles = sizeStyles[size];
  const btnBase =
    'flex shrink-0 items-center justify-center font-semibold leading-none transition hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div
      className={`inline-flex items-stretch overflow-hidden border border-zinc-300 bg-white ${styles.root} ${
        disabled || loading ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className={`${btnBase} ${styles.btn} border-r border-zinc-200`}
        disabled={disabled || loading || quantity <= 1}
        onClick={onDecrement}
      >
        −
      </button>
      <span
        className={`flex items-center justify-center border-r border-zinc-200 font-semibold tabular-nums ${styles.qty} ${
          loading ? 'opacity-50' : ''
        }`}
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={`${btnBase} ${styles.btn}`}
        disabled={disabled || loading || atMax}
        onClick={onIncrement}
      >
        +
      </button>
    </div>
  );
}
