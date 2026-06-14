import type { OrderFulfillmentStatus } from '@/types';

export const FULFILLMENT_PIPELINE: OrderFulfillmentStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

export function formatStatusLabel(status: OrderFulfillmentStatus | string): string {
  if (status === 'return_requested') return 'Return requested';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getPipelineIndex(status: OrderFulfillmentStatus | string): number {
  return FULFILLMENT_PIPELINE.indexOf(status as OrderFulfillmentStatus);
}

export function getNextForwardStatus(
  status: OrderFulfillmentStatus | string,
): OrderFulfillmentStatus | null {
  const idx = getPipelineIndex(status);
  if (idx < 0 || idx >= FULFILLMENT_PIPELINE.length - 1) return null;
  return FULFILLMENT_PIPELINE[idx + 1];
}

export function getPreviousPipelineStatus(
  status: OrderFulfillmentStatus | string,
): OrderFulfillmentStatus | null {
  const idx = getPipelineIndex(status);
  if (idx <= 0) return null;
  return FULFILLMENT_PIPELINE[idx - 1];
}

export function isPipelineBackward(
  from: OrderFulfillmentStatus | string,
  to: OrderFulfillmentStatus | string,
): boolean {
  const fromIdx = getPipelineIndex(from);
  const toIdx = getPipelineIndex(to);
  return fromIdx > 0 && toIdx === fromIdx - 1;
}

export function canCancelFrom(status: OrderFulfillmentStatus | string): boolean {
  return ['pending', 'confirmed', 'processing', 'shipped'].includes(status);
}

export function canReturnFrom(status: OrderFulfillmentStatus | string): boolean {
  return false;
}
