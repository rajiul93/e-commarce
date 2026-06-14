import { Suspense } from 'react';
import { ProductsPageContent } from '@/components/shop/products-page-content';

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-9 w-40 rounded-lg bg-zinc-200" />
          <div className="h-96 rounded-xl bg-zinc-200" />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
