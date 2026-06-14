'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/components/shop/product-card';
import { apiFetch } from '@/lib/api';
import { getProductThumbnailUrl } from '@/lib/product-image-utils';
import { useAuthStore } from '@/stores/auth-store';
import type { Order, Product, ProductListResult, Variant } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const POS_PAGE_LIMIT = 100;

type PosProduct = Product & {
  variants?: Variant[];
  matchedVariantId?: string;
};

type PosProductListResult = ProductListResult & {
  items: PosProduct[];
};

type SuccessToast = {
  id: string;
  orderNumber: string;
  total: number;
};

const SUCCESS_TOAST_MS = 4500;

type CartLine = {
  key: string;
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  catalogPrice: number;
  unitPrice: number;
  quantity: number;
};

function getPosItemImage(product: PosProduct, variant: Variant) {
  return variant.image?.url ?? getProductThumbnailUrl(product);
}

export default function AdminPosPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const canCustomPrice = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanning, setScanning] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pos_cash' | 'pos_card'>('pos_cash');
  const [deliveryMode, setDeliveryMode] = useState<'ship_to_address' | 'shop_pickup'>(
    'ship_to_address',
  );
  const [customerPhone, setCustomerPhone] = useState('');
  const [message, setMessage] = useState('');
  const [successToasts, setSuccessToasts] = useState<SuccessToast[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'pos-barcode-scanner';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
      if (query.trim()) setSkuFilter('');
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const productsQuery = useQuery({
    queryKey: ['pos', 'products', page, debouncedQuery, skuFilter],
    queryFn: () =>
      apiFetch<PosProductListResult>('/api/v1/product/pos-search', {
        token,
        params: {
          page,
          limit: POS_PAGE_LIMIT,
          ...(skuFilter ? { sku: skuFilter } : debouncedQuery ? { q: debouncedQuery } : {}),
        },
      }),
    enabled: !!token,
  });

  const results = productsQuery.data?.items ?? [];
  const totalPages = productsQuery.data?.totalPages ?? 0;
  const total = productsQuery.data?.total ?? 0;

  const gridItems = useMemo(() => {
    const items: { product: PosProduct; variant: Variant }[] = [];
    for (const product of results) {
      for (const variant of product.variants ?? []) {
        items.push({ product, variant });
      }
    }
    return items;
  }, [results]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setScanning(true);
    setMessage('');
    await new Promise((r) => setTimeout(r, 100));
    const scanner = new Html5Qrcode(scannerDivId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decoded) => {
          setQuery(decoded);
          setSkuFilter(decoded);
          setPage(1);
          void stopScanner();
        },
        () => {},
      );
    } catch {
      setMessage('Camera access failed. Enter SKU manually.');
      await stopScanner();
    }
  }, [stopScanner]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  function addToCart(product: PosProduct, variant: Variant) {
    const key = `${product._id}-${variant._id}`;
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key,
          productId: product._id,
          variantId: variant._id,
          title: product.title,
          sku: variant.sku,
          catalogPrice: variant.price,
          unitPrice: variant.price,
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(key: string, quantity: number) {
    if (quantity < 1) {
      setCart((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity } : l)));
  }

  function updateUnitPrice(key: string, raw: string) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, unitPrice: parsed } : l)));
  }

  function clearSearch() {
    setQuery('');
    setDebouncedQuery('');
    setSkuFilter('');
    setPage(1);
  }

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const completeSale = useMutation({
    mutationFn: () =>
      apiFetch<Order>('/api/v1/order/admin/pos', {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: cart.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
          paymentMethod,
          deliveryMode,
          ...(customerPhone.trim()
            ? { guestContact: { phone: customerPhone.trim() } }
            : {}),
        }),
      }),
    onSuccess: (order) => {
      setCart([]);
      setCustomerPhone('');
      setMessage('');
      const toastId = `${order._id}-${Date.now()}`;
      setSuccessToasts((prev) => [
        ...prev,
        {
          id: toastId,
          orderNumber: order.orderNumber,
          total: order.totalAmount,
        },
      ]);
      window.setTimeout(() => {
        setSuccessToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, SUCCESS_TOAST_MS);
    },
    onError: (err: Error) => setMessage(err.message),
  });

  return (
    <div className="relative space-y-6">
      {successToasts.length > 0 ? (
        <div
          className="pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-2"
          aria-live="polite"
        >
          {successToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 shadow-lg"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm text-white">
                ✓
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-green-900">Sale completed</p>
                <p className="text-sm text-green-800">
                  Order {toast.orderNumber} · {formatPrice(toast.total)}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSuccessToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="ml-auto shrink-0 text-green-700 hover:text-green-900"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <p className="text-sm text-zinc-500">Browse, search or scan products · staff access only</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex gap-2">
            <Input
              label="Search product or SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Product name or barcode (SKU)"
            />
            <Button
              type="button"
              variant="secondary"
              className="mt-6 shrink-0"
              onClick={() => (scanning ? stopScanner() : startScanner())}
            >
              {scanning ? 'Stop scan' : 'Scan'}
            </Button>
          </div>

          {(debouncedQuery || skuFilter) && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs text-zinc-500 underline"
            >
              Clear search · show all products
            </button>
          )}

          {scanning ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div id={scannerDivId} className="w-full" />
            </div>
          ) : null}

          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>
              {productsQuery.isLoading
                ? 'Loading products…'
                : `${total} product${total === 1 ? '' : 's'}`}
            </span>
            {totalPages > 1 ? (
              <span>
                Page {page} of {totalPages}
              </span>
            ) : null}
          </div>

          <div className="max-h-[40rem] overflow-y-auto rounded-xl border border-zinc-200 p-3">
            {gridItems.length === 0 && !productsQuery.isLoading ? (
              <p className="p-4 text-sm text-zinc-500">No products found.</p>
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {gridItems.map(({ product, variant }) => (
                <article
                  key={variant._id}
                  className={`flex flex-col overflow-hidden rounded-lg border bg-white ${
                    product.matchedVariantId === variant._id
                      ? 'border-orange-400 ring-2 ring-orange-200'
                      : 'border-zinc-200'
                  }`}
                >
                  <div className="aspect-square overflow-hidden bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPosItemImage(product, variant)}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900">
                      {product.title}
                    </p>
                    <p className="truncate text-[10px] text-zinc-500">{variant.sku}</p>
                    <p className="text-[10px] text-zinc-500">Stock: {variant.stock}</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatPrice(variant.price)}
                    </p>
                    <Button
                      type="button"
                      className="mt-auto w-full px-2 py-1.5 text-xs"
                      disabled={variant.stock <= 0}
                      onClick={() => addToCart(product, variant)}
                    >
                      {variant.stock <= 0 ? 'Out of stock' : 'Add'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1 || productsQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1 text-sm ${
                    p === page
                      ? 'bg-zinc-900 text-white'
                      : 'border border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages || productsQuery.isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <h2 className="font-semibold">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-zinc-500">Cart is empty</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {cart.map((line) => (
                <li key={line.key} className="space-y-2 py-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{line.title}</p>
                      <p className="text-xs text-zinc-500">{line.sku}</p>
                    </div>
                    <span className="shrink-0 font-medium">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canCustomPrice ? (
                      <label className="flex items-center gap-1 text-xs text-zinc-600">
                        <span>Price</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unitPrice}
                          onChange={(e) => updateUnitPrice(line.key, e.target.value)}
                          className="w-24 rounded border border-zinc-300 px-2 py-1 text-center"
                        />
                      </label>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        {formatPrice(line.unitPrice)} each
                      </span>
                    )}
                    <label className="flex items-center gap-1 text-xs text-zinc-600">
                      <span>Qty</span>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateQty(line.key, Number(e.target.value))}
                        className="w-14 rounded border border-zinc-300 px-2 py-1 text-center"
                      />
                    </label>
                    {canCustomPrice && line.unitPrice !== line.catalogPrice ? (
                      <span className="text-[10px] text-orange-600">
                        Was {formatPrice(line.catalogPrice)}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Payment</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="pos_cash">Cash</option>
              <option value="pos_card">Card</option>
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Fulfilment</span>
            <select
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as typeof deliveryMode)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="ship_to_address">Delivery</option>
              <option value="shop_pickup">Shop pickup</option>
            </select>
          </label>

          <Input
            label="Phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Customer phone for delivery contact"
          />

          {message ? <p className="text-sm text-red-600">{message}</p> : null}

          <Button
            disabled={cart.length === 0 || completeSale.isPending}
            onClick={() => completeSale.mutate()}
            className="w-full"
          >
            {completeSale.isPending ? 'Processing…' : 'Complete sale'}
          </Button>
        </div>
      </div>
    </div>
  );
}
