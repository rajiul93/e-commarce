'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { formatReturnReason, RETURN_REASON_OPTIONS } from '@/lib/return-reasons';
import { formatStatusLabel } from '@/lib/order-status-flow';
import { useAuthStore } from '@/stores/auth-store';
import type { Order, OrderReturnReason } from '@/types';
import { useEffect, useState } from 'react';

export default function OrdersPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [returnDialogOrder, setReturnDialogOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState<OrderReturnReason>('wrong_item');
  const [returnDescription, setReturnDescription] = useState('');

  async function loadOrders() {
    if (!token) return;
    try {
      const data = await apiFetch<Order[]>('/api/v1/order', { token });
      setOrders(data ?? []);
    } catch {
      setOrders([]);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, [token]);

  async function cancelOrder(id: string) {
    if (!token) return;
    setLoadingId(id);
    setMessage('');
    try {
      await apiFetch(`/api/v1/order/${id}/cancel`, { method: 'PATCH', token });
      await loadOrders();
      setMessage('Order cancelled');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not cancel order');
    } finally {
      setLoadingId(null);
    }
  }

  function openReturnDialog(order: Order) {
    setReturnReason('wrong_item');
    setReturnDescription('');
    setReturnDialogOrder(order);
  }

  async function submitReturnRequest() {
    if (!token || !returnDialogOrder) return;
    const description = returnDescription.trim();
    if (description.length < 10) {
      setMessage('Please describe the issue (at least 10 characters)');
      return;
    }

    setLoadingId(returnDialogOrder._id);
    setMessage('');
    try {
      await apiFetch(`/api/v1/order/${returnDialogOrder._id}/return`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ reason: returnReason, description }),
      });
      setReturnDialogOrder(null);
      await loadOrders();
      setMessage('Return request submitted. We will review it shortly.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not submit return request');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My orders</h1>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      {orders.length === 0 ? (
        <p className="text-zinc-500">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
          {orders.map((order) => (
            <li key={order._id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm capitalize text-zinc-500">
                    {formatStatusLabel(order.status)} · {order.paymentStatus}
                  </p>
                  {order.status === 'pending' ? (
                    <p className="text-xs text-amber-600">You can cancel while pending</p>
                  ) : null}
                  {order.status === 'delivered' ? (
                    <p className="text-xs text-zinc-500">Eligible for return after delivery</p>
                  ) : null}
                  {order.status === 'return_requested' && order.returnRequest ? (
                    <p className="text-xs text-orange-600">
                      Return pending review — {formatReturnReason(order.returnRequest.reason)}
                    </p>
                  ) : null}
                </div>
                <p className="font-semibold">{formatPrice(order.totalAmount)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' ? (
                  <Button
                    variant="danger"
                    disabled={loadingId === order._id}
                    onClick={() => cancelOrder(order._id)}
                  >
                    Cancel order
                  </Button>
                ) : null}
                {order.status === 'delivered' ? (
                  <Button
                    variant="secondary"
                    disabled={loadingId === order._id}
                    onClick={() => openReturnDialog(order)}
                  >
                    Request return
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!returnDialogOrder}
        onClose={() => setReturnDialogOrder(null)}
        title="Request return"
        description="Tell us why you want to return this order. An admin will review before processing."
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Reason</span>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value as OrderReturnReason)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              {RETURN_REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Description</span>
            <textarea
              value={returnDescription}
              onChange={(e) => setReturnDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Describe the issue in a few sentences (min. 10 characters)"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setReturnDialogOrder(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                loadingId === returnDialogOrder?._id || returnDescription.trim().length < 10
              }
              onClick={() => void submitReturnRequest()}
            >
              {loadingId === returnDialogOrder?._id ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
