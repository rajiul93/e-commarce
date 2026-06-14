import type { Product, ProductOfferType } from '@/types';

export function hasActiveOffer(product: Pick<Product, 'offerType' | 'offerValue'>): boolean {
  const type = product.offerType ?? 'none';
  const value = product.offerValue ?? 0;
  if (type === 'none' || value <= 0) return false;
  if (type === 'percent') return value > 0 && value <= 100;
  return value > 0;
}

export function getOfferLabel(product: Pick<Product, 'offerType' | 'offerValue'>): string | null {
  if (!hasActiveOffer(product)) return null;
  const value = product.offerValue ?? 0;
  if (product.offerType === 'percent') return `${Math.round(value)}% OFF`;
  return `৳${Math.round(value)} OFF`;
}

export function applyOfferToPrice(
  price: number,
  product: Pick<Product, 'offerType' | 'offerValue'>,
): number {
  if (!hasActiveOffer(product)) return price;
  const value = product.offerValue ?? 0;
  if (product.offerType === 'percent') {
    return Math.max(0, Math.round(price * (1 - value / 100)));
  }
  return Math.max(0, Math.round(price - value));
}

export function getProductCardBadges(
  product: Pick<Product, 'isFeatured' | 'isBestSeller' | 'offerType' | 'offerValue'>,
): { key: string; label: string; className: string }[] {
  const badges: { key: string; label: string; className: string }[] = [];

  if (product.isFeatured) {
    badges.push({
      key: 'featured',
      label: 'Featured',
      className: 'bg-violet-600 text-white',
    });
  }
  if (product.isBestSeller) {
    badges.push({
      key: 'best-seller',
      label: 'Best Seller',
      className: 'bg-amber-500 text-white',
    });
  }

  const offerLabel = getOfferLabel(product);
  if (offerLabel) {
    badges.push({
      key: 'offer',
      label: offerLabel,
      className: 'bg-red-600 text-white',
    });
  }

  return badges;
}

export type { ProductOfferType };
