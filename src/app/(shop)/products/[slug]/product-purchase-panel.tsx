'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  findVariantBySelection,
  getAvailableValues,
  isVariantValueInStock,
  resolveVariantAxes,
} from '@/lib/variant-utils';
import { apiFetch } from '@/lib/api';
import { useInvalidateShopCounts } from '@/hooks/use-shop-counts';
import { useAuthStore } from '@/stores/auth-store';
import type { Attribute, OrderSettings, Variant } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const emptyGuestForm = {
  name: '',
  phone: '',
  state: '',
  city: '',
  thana: '',
  localLocation: '',
};

type Props = {
  productId: string;
  variants: Variant[];
  productAttributes?: Attribute[];
  orderSettings: OrderSettings;
};

export function ProductPurchasePanel({
  productId,
  variants,
  productAttributes = [],
  orderSettings,
}: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { invalidateCart } = useInvalidateShopCounts();
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [guestForm, setGuestForm] = useState(emptyGuestForm);
  const [guestSuccess, setGuestSuccess] = useState('');

  const activeVariants = useMemo(
    () => variants.filter((v) => v.status === 'active'),
    [variants],
  );

  const axes = useMemo(
    () => resolveVariantAxes(activeVariants, productAttributes),
    [productAttributes, activeVariants],
  );

  useEffect(() => {
    setSelection({});
    setGuestDialogOpen(false);
    setGuestForm(emptyGuestForm);
    setGuestSuccess('');
    setGuestError('');
    setMessage('');
  }, [productId]);

  const selectedVariant = findVariantBySelection(activeVariants, selection);
  const allAxesSelected = axes.every((axis) => selection[axis.name]);
  const outOfStock = !selectedVariant || selectedVariant.stock < 1;

  function selectValue(axisName: string, value: string) {
    setSelection((prev) => {
      const next = { ...prev, [axisName]: prev[axisName] === value ? '' : value };
      const axisNames = axes.map((a) => a.name);
      const idx = axisNames.indexOf(axisName);
      for (let i = idx + 1; i < axisNames.length; i += 1) {
        delete next[axisNames[i]];
      }
      return next;
    });
  }

  async function handleAddToCart() {
    if (!orderSettings.loggedInCheckout) return;
    if (!token) {
      router.push('/login');
      return;
    }
    if (!selectedVariant) {
      setMessage('Please select all options');
      return;
    }
    setCartLoading(true);
    setMessage('');
    try {
      await apiFetch('/api/v1/cart/items', {
        method: 'POST',
        token,
        body: JSON.stringify({
          productId,
          variantId: selectedVariant._id,
          quantity,
        }),
      });
      await invalidateCart();
      setMessage('Added to cart');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setCartLoading(false);
    }
  }

  function openGuestDialog() {
    if (!selectedVariant) {
      setMessage('Please select all options');
      return;
    }
    setGuestDialogOpen(true);
    setGuestSuccess('');
    setGuestError('');
    setMessage('');
  }

  function closeGuestDialog() {
    if (guestLoading) return;
    setGuestDialogOpen(false);
    setGuestError('');
  }

  async function handleGuestOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVariant) return;

    setGuestLoading(true);
    setGuestError('');
    try {
      const order = await apiFetch<{ orderNumber: string }>('/api/v1/order/guest', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              productId,
              variantId: selectedVariant._id,
              quantity,
            },
          ],
          guestContact: {
            name: guestForm.name.trim(),
            phone: guestForm.phone.trim(),
          },
          addressSnapshot: {
            name: guestForm.name.trim(),
            phone: guestForm.phone.trim(),
            country: 'Bangladesh',
            state: guestForm.state.trim(),
            city: guestForm.city.trim(),
            thana: guestForm.thana.trim(),
            localLocation: guestForm.localLocation.trim(),
          },
          paymentMethod: 'cash_on_delivery',
          currency: 'BDT',
        }),
      });
      setGuestSuccess(`Order ${order.orderNumber} placed! We will contact you soon.`);
      setGuestDialogOpen(false);
      setGuestForm(emptyGuestForm);
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setGuestLoading(false);
    }
  }

  if (!activeVariants.length) {
    return <p className="text-red-600">No variants available for this product.</p>;
  }

  if (!orderSettings.loggedInCheckout && !orderSettings.guestQuickOrder) {
    return <p className="text-zinc-500">Ordering is temporarily unavailable.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 p-4">
      {axes.map((axis) => {
        const available = getAvailableValues(activeVariants, axis.name, selection);
        return (
          <div key={axis.name} className="space-y-2">
            <span className="text-sm font-medium">{axis.name}</span>
            <div className="flex flex-wrap gap-2">
              {available.map((value) => {
                const isSelected = selection[axis.name] === value;
                const inStock = isVariantValueInStock(activeVariants, axis.name, value, selection);
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!inStock}
                    onClick={() => selectValue(axis.name, value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : inStock
                          ? 'border-zinc-300 hover:border-zinc-900'
                          : 'cursor-not-allowed border-zinc-200 text-zinc-400 line-through'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedVariant && allAxesSelected ? (
        <p className="text-lg font-semibold">{formatPrice(selectedVariant.price)}</p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Quantity</span>
        <input
          type="number"
          min={1}
          max={selectedVariant?.stock ?? 1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={!selectedVariant}
          className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {orderSettings.loggedInCheckout ? (
          <>
            <Button
              onClick={handleAddToCart}
              disabled={cartLoading || !allAxesSelected || outOfStock}
            >
              {!allAxesSelected
                ? 'Select options'
                : outOfStock
                  ? 'Out of stock'
                  : cartLoading
                    ? 'Adding…'
                    : 'Add to cart'}
            </Button>
            {token ? (
              <Link
                href="/account/cart"
                className="inline-flex items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
              >
                View cart
              </Link>
            ) : null}
          </>
        ) : null}

        {orderSettings.guestQuickOrder ? (
          <Button
            variant="secondary"
            onClick={openGuestDialog}
            disabled={!allAxesSelected || outOfStock}
          >
            {!allAxesSelected ? 'Select options' : outOfStock ? 'Out of stock' : 'Order'}
          </Button>
        ) : null}
      </div>

      {orderSettings.loggedInCheckout && !token ? (
        <p className="text-xs text-zinc-500">
          <Link href="/login" className="underline">
            Login
          </Link>{' '}
          to save items in cart and track orders from your account.
        </p>
      ) : null}

      <Dialog
        open={guestDialogOpen}
        onClose={closeGuestDialog}
        title="Quick order"
        description="Enter your delivery details to place the order."
      >
        <form onSubmit={handleGuestOrder} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Name"
              value={guestForm.name}
              onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={guestForm.phone}
              onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
              required
            />
            <Input
              label="Division (বিভাগ)"
              value={guestForm.state}
              onChange={(e) => setGuestForm({ ...guestForm, state: e.target.value })}
              required
            />
            <Input
              label="District / Jela (জেলা)"
              value={guestForm.city}
              onChange={(e) => setGuestForm({ ...guestForm, city: e.target.value })}
              required
            />
            <Input
              label="Thana (থানা)"
              value={guestForm.thana}
              onChange={(e) => setGuestForm({ ...guestForm, thana: e.target.value })}
              required
            />
            <Input
              label="Local location"
              value={guestForm.localLocation}
              onChange={(e) => setGuestForm({ ...guestForm, localLocation: e.target.value })}
              required
              className="sm:col-span-2"
            />
          </div>
          <p className="text-xs text-zinc-500">Payment: Cash on delivery</p>
          {guestError ? <p className="text-sm text-red-600">{guestError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={guestLoading}>
              {guestLoading ? 'Placing order…' : 'Confirm order'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeGuestDialog} disabled={guestLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>

      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      {guestSuccess ? <p className="text-sm text-green-600">{guestSuccess}</p> : null}
    </div>
  );
}
