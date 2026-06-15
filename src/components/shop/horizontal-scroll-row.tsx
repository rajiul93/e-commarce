import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function HorizontalScrollRow({ children, className = '', innerClassName = '' }: Props) {
  return (
    <div
      className={`-mx-4 min-w-0 max-w-full overflow-x-auto overscroll-x-contain px-4 pb-2 touch-pan-x [-webkit-overflow-scrolling:touch] ${className}`}
    >
      <div className={`flex w-max flex-nowrap gap-4 ${innerClassName}`}>{children}</div>
    </div>
  );
}
