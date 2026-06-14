import type { ReactNode } from 'react';

type StaticPageLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function StaticPageLayout({ title, description, children }: StaticPageLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-8 space-y-3 border-b border-zinc-200 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
        {description ? <p className="text-base text-zinc-600">{description}</p> : null}
      </header>
      <div className="space-y-6 text-sm leading-relaxed text-zinc-700 sm:text-base">{children}</div>
    </article>
  );
}

export function StaticSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
