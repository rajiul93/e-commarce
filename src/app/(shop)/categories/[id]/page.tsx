export const revalidate = 60;

import { ProductCard } from '@/components/shop/product-card';
import { getCategory, getProducts } from '@/lib/server-api';
import { notFound } from 'next/navigation';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, products] = await Promise.all([
    getCategory(id),
    getProducts({ category: id, limit: 24 }),
  ]);

  if (!category) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">{category.categoryName}</h1>
        {category.description ? (
          <p className="mt-2 text-zinc-600">{category.description}</p>
        ) : null}
      </div>

      {products.items.length === 0 ? (
        <p className="text-zinc-500">No products in this category.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
