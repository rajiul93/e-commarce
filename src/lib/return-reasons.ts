import type { OrderReturnReason } from '@/types';

export const RETURN_REASON_OPTIONS: { value: OrderReturnReason; label: string }[] = [
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'damaged', label: 'Item arrived damaged' },
  { value: 'defective', label: 'Product is defective' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' },
];

export function formatReturnReason(reason: OrderReturnReason | string): string {
  return RETURN_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? reason;
}
