import type { Order } from '@/types';

const PLACEHOLDER_PHONES = new Set(['-', '—', 'n/a', 'N/A']);

function isRealPhone(value?: string | null): value is string {
  const trimmed = value?.trim();
  return !!trimmed && !PLACEHOLDER_PHONES.has(trimmed);
}

export function getOrderCustomerPhone(order: Order): string | null {
  if (isRealPhone(order.guestContact?.phone)) return order.guestContact!.phone.trim();

  if (isRealPhone(order.addressSnapshot?.phone)) return order.addressSnapshot!.phone.trim();

  const user = typeof order.userId === 'object' && order.userId ? order.userId : null;
  if (isRealPhone(user?.phone)) return user!.phone!.trim();

  return null;
}

export function getOrderCustomerName(order: Order): string | null {
  const guestName = order.guestContact?.name?.trim();
  if (guestName) return guestName;

  const user = typeof order.userId === 'object' && order.userId ? order.userId : null;
  const userName = user?.name?.trim();
  if (userName) return userName;

  const addrName = order.addressSnapshot?.name?.trim();
  if (addrName && addrName !== 'Shop counter') return addrName;

  return null;
}

export function formatOrderCustomerContact(order: Order): string | null {
  const phone = getOrderCustomerPhone(order);
  if (!phone) return null;

  const name = getOrderCustomerName(order);
  return name ? `${name} · ${phone}` : phone;
}
