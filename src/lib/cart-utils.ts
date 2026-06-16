import type { Cart, CartLine } from '@/types';

export function getCartLineProductId(line: CartLine): string {
  return typeof line.productId === 'object' ? line.productId._id : line.productId;
}

export function getCartLineVariantId(line: CartLine): string {
  if (!line.variantId) return '';
  return typeof line.variantId === 'object' ? line.variantId._id : line.variantId;
}

export function getCartLineMaxStock(line: CartLine): number | undefined {
  if (!line.variantId || typeof line.variantId !== 'object') return undefined;
  return line.variantId.stock;
}

export function findCartLine(
  cart: Cart | null | undefined,
  productId: string,
  variantId?: string,
): CartLine | undefined {
  if (!cart) return undefined;
  const vid = variantId ?? '';
  return cart.items.find(
    (line) => getCartLineProductId(line) === productId && getCartLineVariantId(line) === vid,
  );
}
