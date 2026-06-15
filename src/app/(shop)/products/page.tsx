export const revalidate = 60;

import { ProductsPageContent } from '@/components/shop/products-page-content';
import {
  parseCsvParam,
  searchParamsToShopParams,
  shopParamsToQuery,
} from '@/components/shop/shop-filters';
import { getBrands, getCategories, getCategory, getProducts } from '@/lib/server-api';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParamsToShopParams(await searchParams);
  const categoryIds = parseCsvParam(params.category);
  const query = shopParamsToQuery(params);

  const [products, categories, brands, activeCategory] = await Promise.all([
    getProducts(query),
    getCategories(),
    getBrands(),
    categoryIds.length === 1 ? getCategory(categoryIds[0]) : Promise.resolve(null),
  ]);

  return (
    <ProductsPageContent
      products={products}
      categories={categories}
      brands={brands}
      activeCategory={activeCategory}
      params={params}
    />
  );
}
