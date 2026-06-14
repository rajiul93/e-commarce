import type { ImageRef, Product } from '@/types';

const PLACEHOLDER = '/placeholder-product.svg';

export function getProductThumbnailUrl(product: Pick<Product, 'thumbnail' | 'gallery'>): string {
  return product.thumbnail?.url ?? product.gallery?.[0]?.url ?? PLACEHOLDER;
}

export function getProductGalleryImages(
  product: Pick<Product, 'gallery'>,
): ImageRef[] {
  return product.gallery ?? [];
}

export function getProductAllImages(
  product: Pick<Product, 'thumbnail' | 'gallery'>,
): ImageRef[] {
  const images: ImageRef[] = [];
  if (product.thumbnail?.url) images.push(product.thumbnail);
  for (const img of product.gallery ?? []) {
    if (img._id !== product.thumbnail?._id) images.push(img);
  }
  return images;
}
