import type { Metadata } from 'next';
import type { Product } from '@/types';
import { SITE_NAME } from '@/lib/site-config';

export function buildProductMetadata(product: Product): Metadata {
  const seoTitle = product.seoTitle?.trim();
  const seoDescription = product.seoDescription?.trim();
  const ogTitle = product.ogTitle?.trim();
  const ogDescription = product.ogDescription?.trim();
  const ogImageUrl = product.ogImage?.url?.trim();

  if (!seoTitle && !seoDescription && !ogTitle && !ogDescription && !ogImageUrl) {
    return { title: product.title };
  }

  return {
    ...(seoTitle ? { title: { absolute: seoTitle } } : {}),
    ...(seoDescription ? { description: seoDescription } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      ...(ogTitle ? { title: ogTitle } : seoTitle ? { title: seoTitle } : {}),
      ...(ogDescription
        ? { description: ogDescription }
        : seoDescription
          ? { description: seoDescription }
          : {}),
      ...(ogImageUrl
        ? { images: [{ url: ogImageUrl, alt: ogTitle || seoTitle || product.title }] }
        : {}),
    },
    twitter: {
      card: ogImageUrl ? 'summary_large_image' : 'summary',
      ...(ogTitle ? { title: ogTitle } : seoTitle ? { title: seoTitle } : {}),
      ...(ogDescription
        ? { description: ogDescription }
        : seoDescription
          ? { description: seoDescription }
          : {}),
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  };
}
