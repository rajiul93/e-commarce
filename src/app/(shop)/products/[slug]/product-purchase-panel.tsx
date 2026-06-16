'use client';

import { CartQuantityControls } from '@/components/shop/cart-quantity-controls';
import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { findCartLine } from '@/lib/cart-utils';
import { apiFetch } from '@/lib/api';
import {
  findVariantBySelection,
  getAvailableValues,
  isVariantValueInStock,
  resolveVariantAxes,
} from '@/lib/variant-utils';
import { useAuthStore } from '@/stores/auth-store';
import type { Attribute, OrderSettings, Variant } from '@/types';
import { WishlistButton } from '@/components/shop/wishlist-button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

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

const actionBtnClass =
  'inline-flex shrink-0 items-center justify-center !rounded-md !px-2 !py-1.5 !text-[11px] !leading-tight sm:!rounded-lg sm:!px-4 sm:!py-2 sm:!text-sm';

export function ProductPurchasePanel({
  productId,
  variants,
  productAttributes = [],
  orderSettings,
}: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { cart, addToCart, updateLineQuantity, updatingLineId } = useCart();
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});
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

  const selectedVariant = findVariantBySelection(activeVariants, selection);
  const allAxesSelected = axes.every((axis) => selection[axis.name]);
  const outOfStock =
    allAxesSelected && selectedVariant != null && selectedVariant.stock < 1;
  const cartLine = selectedVariant
    ? findCartLine(cart, productId, selectedVariant._id)
    : undefined;
  const inCart = Boolean(cartLine);
  const cartLineLoading = cartLine ? updatingLineId === cartLine._id : false;
  const draftQuantity = selectedVariant
    ? (draftQuantities[selectedVariant._id] ?? 1)
    : 1;
  const displayQuantity = inCart && cartLine ? cartLine.quantity : draftQuantity;
  const maxQuantity = selectedVariant?.stock;

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

  async function handleQuantityIncrement() {
    if (!selectedVariant || !allAxesSelected || outOfStock) return;

    if (inCart && cartLine) {
      try {
        await updateLineQuantity(cartLine._id, cartLine.quantity + 1);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to update quantity');
      }
      return;
    }

    setDraftQuantities((prev) => ({
      ...prev,
      [selectedVariant._id]: Math.min((prev[selectedVariant._id] ?? 1) + 1, selectedVariant.stock),
    }));
  }

  async function handleQuantityDecrement() {
    if (!selectedVariant || !allAxesSelected) return;

    if (inCart && cartLine) {
      try {
        await updateLineQuantity(cartLine._id, cartLine.quantity - 1);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to update quantity');
      }
      return;
    }

    setDraftQuantities((prev) => ({
      ...prev,
      [selectedVariant._id]: Math.max((prev[selectedVariant._id] ?? 1) - 1, 1),
    }));
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
      await addToCart({
        productId,
        variantId: selectedVariant._id,
        quantity: draftQuantity,
      });
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
              quantity: draftQuantity,
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
          <div key={axis.name} className="flex flex-wrap items-center justify-start gap-x-3 gap-y-2">
            <div className="shrink-0 text-sm font-bold">{axis.name}</div>
            <div className="flex flex-wrap items-center justify-start gap-2">
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

      <div className="flex flex-col items-center justify-start gap-2.5 sm:gap-3">
        <div className="flex w-full items-center justify-start gap-1.5 sm:gap-2">
          <span className="text-xs font-medium text-zinc-700 sm:text-sm">Qty</span>
          <CartQuantityControls
            quantity={displayQuantity}
            max={maxQuantity}
            disabled={!selectedVariant || !allAxesSelected || outOfStock}
            loading={cartLineLoading}
            size="sm"
            onIncrement={handleQuantityIncrement}
            onDecrement={handleQuantityDecrement}
          />
          {inCart ? (
            <span className="text-[10px] text-zinc-500 sm:text-xs">In cart</span>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-1.5 sm:gap-2">
          {orderSettings.loggedInCheckout ? (
            <>
              {inCart ? (
                <Link
                  href="/account/cart"
                  className={`inline-flex items-center rounded-md bg-primary font-semibold text-primary-foreground transition hover:bg-primary/70 ${actionBtnClass}`}
                >
                  <span className="sm:hidden">Cart</span>
                  <span className="hidden sm:inline">Go to cart</span>
                </Link>
              ) : (
                <Button
                  className={actionBtnClass}
                  onClick={handleAddToCart}
                  disabled={cartLoading || !allAxesSelected || outOfStock}
                >
                  {!allAxesSelected ? (
                    <>
                      <span className="sm:hidden">Options</span>
                      <span className="hidden sm:inline">Select options</span>
                    </>
                  ) : outOfStock ? (
                    <>
                      <span className="sm:hidden">Sold out</span>
                      <span className="hidden sm:inline">Out of stock</span>
                    </>
                  ) : cartLoading ? (
                    '…'
                  ) : (
                    <>
                      <span className="sm:hidden">Add</span>
                      <span className="hidden sm:inline">Add to cart</span>
                    </>
                  )}
                </Button>
              )}
            </>
          ) : null}

          {orderSettings.guestQuickOrder ? (
            <Button
              variant="secondary"
              className={actionBtnClass}
              onClick={openGuestDialog}
              disabled={!allAxesSelected || outOfStock}
              title={!allAxesSelected ? 'Select all options first' : undefined}
            >
              {outOfStock ? (
                <>
                  <span className="sm:hidden">Sold out</span>
                  <span className="hidden sm:inline">Out of stock</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Order</span>
                  <span className="hidden sm:inline">Quick order</span>
                </>
              )}
            </Button>
          ) : null}

          <WishlistButton
            productId={productId}
            className={actionBtnClass}
            onMessage={(text) => setMessage(text)}
          />
        </div>
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

      {message ? (
        <p
          className={`text-sm ${
            message === 'Added to cart' || message === 'Added to wishlist'
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {message}
        </p>
      ) : null}
      {guestSuccess ? <p className="text-sm text-green-600">{guestSuccess}</p> : null}
    </div>
  );
}
