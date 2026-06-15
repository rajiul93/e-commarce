import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function HorizontalScrollRow({ children, className = '', innerClassName = '' }: Props) {
  return (
    <div
      className={`-mx-4 overflow-x-auto px-4 pb-2 scrollbar-thin ${className}`}
    >
      <div className={`flex w-max gap-4 ${innerClassName}`}>{children}</div>
    </div>
  );
}
