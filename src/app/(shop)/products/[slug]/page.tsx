export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { formatPrice } from '@/components/shop/product-card';
import { sanitizeProductDescription } from '@/components/shop/product-description';
import { ProductDetailTabs } from '@/components/shop/product-detail-tabs';
import { getProductAllImages, getProductGalleryImages, getProductThumbnailUrl } from '@/lib/product-image-utils';
import { buildProductMetadata } from '@/lib/product-seo';
import { getOrderSettings, getProductBySlug, getProductSlugs } from '@/lib/server-api';
import { notFound } from 'next/navigation';
import { ProductPurchasePanel } from './product-purchase-panel';
import { WishlistButton } from '@/components/shop/wishlist-button';

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  return buildProductMetadata(product);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const heroUrl = getProductThumbnailUrl(product);
  const gallery = getProductGalleryImages(product);
  const allImages = getProductAllImages(product);
  const variants = product.variants ?? [];
  const orderSettings = await getOrderSettings();

  let descriptionHtml = '';
  try {
    descriptionHtml = sanitizeProductDescription(product.description ?? '');
  } catch {
    descriptionHtml = '';
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroUrl} alt={product.title} className="h-full w-full object-cover" />
          </div>
          {gallery.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Gallery</p>
              <div className="flex gap-2 overflow-x-auto">
                {gallery.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img._id}
                    src={img.url}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}
          {allImages.length === 0 ? (
            <p className="text-sm text-zinc-500">No images for this product yet.</p>
          ) : null}
        </div>

        <div className="space-y-6">
          {product.category ? (
            <p className="text-sm uppercase tracking-wide text-zinc-500">
              {product.category.categoryName}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold text-zinc-900">{product.title}</h1>
          {product.brand ? (
            <p className="text-sm text-zinc-600">Brand: {product.brand.brandName}</p>
          ) : null}
          <p className="text-2xl font-semibold">
            {formatPrice(product.minPrice ?? variants[0]?.price)}
          </p>
          {product.shortDescription ? (
            <p className="text-zinc-600">{product.shortDescription}</p>
          ) : null}

          <ProductPurchasePanel
            productId={product._id}
            variants={variants}
            productAttributes={product.attributes ?? []}
            orderSettings={orderSettings}
          />
          <WishlistButton productId={product._id} />
        </div>
      </div>

      <ProductDetailTabs
        hasDescription={Boolean(descriptionHtml)}
        descriptionHtml={descriptionHtml}
        averageRating={product.averageRating ?? 0}
      />
    </div>
  );
}
