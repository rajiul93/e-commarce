'use client';

import { downloadOrderVoucher } from '@/components/admin/order-voucher-pdf';
import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import {
  canCancelFrom,
  formatStatusLabel,
  FULFILLMENT_PIPELINE,
  getNextForwardStatus,
  getPreviousPipelineStatus,
  isPipelineBackward,
} from '@/lib/order-status-flow';
import { formatReturnReason } from '@/lib/return-reasons';
import { formatOrderCustomerContact, getOrderCustomerPhone } from '@/lib/order-customer';
import { canManageOrdersAdmin } from '@/lib/admin-access';
import { useAuthStore } from '@/stores/auth-store';
import type { Order, OrderFulfillmentStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

const STATUS_FLOW: OrderFulfillmentStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'return_requested',
  'cancelled',
  'returned',
];

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    return_requested: 'bg-amber-100 text-amber-900',
    cancelled: 'bg-zinc-200 text-zinc-700',
    returned: 'bg-orange-100 text-orange-800',
  };
  return colors[status] ?? 'bg-zinc-100 text-zinc-700';
}

function channelBadge(channel?: string) {
  if (channel === 'pos') return 'bg-orange-100 text-orange-800';
  if (channel === 'phone') return 'bg-cyan-100 text-cyan-800';
  return 'bg-slate-100 text-slate-800';
}

function OrderStatusStepper({ current }: { current: OrderFulfillmentStatus | string }) {
  const currentIdx = FULFILLMENT_PIPELINE.indexOf(current as OrderFulfillmentStatus);

  if (currentIdx < 0) {
    return (
      <p className="text-sm capitalize text-zinc-600">
        Terminal status: <span className="font-medium">{formatStatusLabel(current)}</span>
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap items-center gap-1 text-xs">
      {FULFILLMENT_PIPELINE.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={step} className="flex items-center gap-1">
            {idx > 0 ? <span className="text-zinc-300">→</span> : null}
            <span
              className={`rounded-full px-2.5 py-1 font-medium capitalize ${
                active
                  ? 'bg-zinc-900 text-white'
                  : done
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type RevertDialogState = {
  orderId: string;
  from: OrderFulfillmentStatus;
  to: OrderFulfillmentStatus;
};

export default function AdminOrdersPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const canManageOrders = canManageOrdersAdmin(user?.role);
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<'online' | 'phone' | 'pos' | ''>('');
  const [status, setStatus] = useState<OrderFulfillmentStatus | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revertDialog, setRevertDialog] = useState<RevertDialogState | null>(null);
  const [revertComment, setRevertComment] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [returnAdminNote, setReturnAdminNote] = useState('');

  const orders = useQuery({
    queryKey: ['admin', 'orders', channel, status],
    queryFn: () =>
      apiFetch<Order[]>('/api/v1/order/admin', {
        token,
        params: {
          ...(channel ? { channel } : {}),
          ...(status ? { status } : {}),
        },
      }),
    enabled: !!token,
  });

  const selectedOrder = useQuery({
    queryKey: ['admin', 'order', selectedId],
    queryFn: () => apiFetch<Order>(`/api/v1/order/admin/${selectedId}`, { token }),
    enabled: !!token && !!selectedId,
  });

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status: next,
      statusComment,
    }: {
      id: string;
      status: OrderFulfillmentStatus;
      statusComment?: string;
    }) =>
      apiFetch<Order>(`/api/v1/order/admin/${id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          status: next,
          ...(statusComment ? { statusComment } : {}),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedId] });
      setRevertDialog(null);
      setRevertComment('');
    },
  });

  const approveReturn = useMutation({
    mutationFn: ({
      id,
      refundAmount: amount,
      adminNote,
    }: {
      id: string;
      refundAmount?: number;
      adminNote?: string;
    }) =>
      apiFetch<Order>(`/api/v1/order/admin/${id}/return/approve`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          ...(amount !== undefined ? { refundAmount: amount } : {}),
          ...(adminNote ? { adminNote } : {}),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedId] });
      setRefundAmount('');
      setReturnAdminNote('');
    },
  });

  const rejectReturn = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      apiFetch<Order>(`/api/v1/order/admin/${id}/return/reject`, {
        method: 'POST',
        token,
        body: JSON.stringify(adminNote ? { adminNote } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedId] });
      setReturnAdminNote('');
    },
  });

  const markPaymentReceived = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      apiFetch<Order>(`/api/v1/order/admin/${id}/payment-received`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(adminNote ? { adminNote } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedId] });
    },
  });

  const orderActionPending =
    updateStatus.isPending ||
    approveReturn.isPending ||
    rejectReturn.isPending ||
    markPaymentReceived.isPending;

  const order = selectedOrder.data;

  useEffect(() => {
    setRefundAmount('');
    setReturnAdminNote('');
  }, [selectedId]);

  const nextForward = useMemo(
    () => (order?.status ? getNextForwardStatus(order.status) : null),
    [order?.status],
  );

  const previousStep = useMemo(
    () => (order?.status ? getPreviousPipelineStatus(order.status) : null),
    [order?.status],
  );

  function advanceForward() {
    if (!order || !nextForward) return;
    updateStatus.mutate({ id: order._id, status: nextForward });
  }

  function openRevertDialog() {
    if (!order || !previousStep) return;
    setRevertComment('');
    setRevertDialog({
      orderId: order._id,
      from: order.status as OrderFulfillmentStatus,
      to: previousStep,
    });
  }

  function confirmRevert() {
    if (!revertDialog) return;
    updateStatus.mutate({
      id: revertDialog.orderId,
      status: revertDialog.to,
      statusComment: revertComment.trim(),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-zinc-500">Step through fulfilment one status at a time</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">All channels</option>
            <option value="online">Online</option>
            <option value="phone">Phone</option>
            <option value="pos">POS</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {orders.isLoading ? (
            <p>Loading…</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders.data ?? []).map((row) => (
                    <tr
                      key={row._id}
                      onClick={() => setSelectedId(row._id)}
                      className={`cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 ${
                        selectedId === row._id ? 'bg-zinc-50' : ''
                      }`}
                    >
                      <td className="p-3">
                        <p className="font-medium">{row.orderNumber}</p>
                        <p className="text-xs text-zinc-500">
                          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                        </p>
                        {getOrderCustomerPhone(row) ? (
                          <p className="text-xs text-zinc-600">{getOrderCustomerPhone(row)}</p>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${channelBadge(row.channel)}`}
                        >
                          {row.channel ?? 'online'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{formatPrice(row.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selectedId ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              Select an order to view details
            </div>
          ) : selectedOrder.isLoading ? (
            <p>Loading order…</p>
          ) : order ? (
            <div className="space-y-4 rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{order.orderNumber}</h2>
                  <p className="text-xs text-zinc-500 capitalize">
                    {order.status} · {order.paymentStatus}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => downloadOrderVoucher(order)}
                  className="text-xs"
                >
                  Download voucher
                </Button>
              </div>

              <OrderStatusStepper current={order.status} />

              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${channelBadge(order.channel)}`}>
                  {order.channel === 'pos' ? 'Sold via POS' : order.channel}
                </span>
                {order.deliveryMode ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5">{order.deliveryMode}</span>
                ) : null}
              </div>

              {formatOrderCustomerContact(order) ? (
                <div className="text-sm">
                  <p className="font-medium">Customer contact</p>
                  <p className="text-zinc-600">{formatOrderCustomerContact(order)}</p>
                </div>
              ) : null}

              {order.addressSnapshot && order.channel !== 'pos' ? (
                <div className="text-sm">
                  <p className="font-medium">
                    {order.deliveryMode === 'shop_pickup' ? 'Pickup' : 'Delivery address'}
                  </p>
                  <p className="text-zinc-600">
                    {order.addressSnapshot.name}
                    {getOrderCustomerPhone(order) ? '' : ` · ${order.addressSnapshot.phone}`}
                  </p>
                  <p className="text-zinc-600">
                    {order.addressSnapshot.localLocation}, {order.addressSnapshot.thana},{' '}
                    {order.addressSnapshot.city}
                  </p>
                </div>
              ) : order.channel === 'pos' && order.deliveryMode === 'ship_to_address' ? (
                <div className="text-sm">
                  <p className="font-medium">Fulfilment</p>
                  <p className="text-zinc-600">POS delivery — contact customer for address</p>
                </div>
              ) : null}

              <ul className="divide-y divide-zinc-100 text-sm">
                {(order.items ?? []).map((item, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span>
                      {item.productTitle} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.lineSubtotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-zinc-200 pt-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.itemsSubtotal ?? order.totalAmount)}</span>
                </div>
                {order.couponCode ? (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon {order.couponCode}</span>
                    <span>-{formatPrice(order.couponDiscountAmount ?? 0)}</span>
                  </div>
                ) : null}
                <div className="mt-1 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {order.returnRequest ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-medium text-amber-900">Return request</p>
                  <p className="mt-1 text-amber-800">
                    {formatReturnReason(order.returnRequest.reason)}
                  </p>
                  <p className="mt-1 text-amber-700">{order.returnRequest.description}</p>
                  {order.returnRequest.requestedAt ? (
                    <p className="mt-1 text-xs text-amber-600">
                      Requested {new Date(order.returnRequest.requestedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {(order.statusHistory?.length ?? 0) > 0 ? (
                <div className="space-y-2 border-t border-zinc-200 pt-3">
                  <p className="text-sm font-medium">Status history</p>
                  <ul className="max-h-40 space-y-2 overflow-y-auto text-xs text-zinc-600">
                    {[...(order.statusHistory ?? [])].reverse().map((entry, i) => (
                      <li key={i} className="rounded-lg bg-zinc-50 p-2">
                        <p className="font-medium capitalize text-zinc-800">
                          {entry.from} → {entry.to}
                          {entry.changedAt
                            ? ` · ${new Date(entry.changedAt).toLocaleString()}`
                            : ''}
                        </p>
                        {entry.comment ? (
                          <p className="mt-1 text-zinc-600">{entry.comment}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {canManageOrders ? (
                <div className="space-y-3 border-t border-zinc-200 pt-3">
                  {order.status === 'return_requested' ? (
                    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                      <p className="text-sm font-medium">Return approval</p>
                      <p className="text-xs text-zinc-600">
                        Approve after product is received. Refund amount is at your discretion.
                      </p>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium">Refund amount (optional)</span>
                        <input
                          type="number"
                          min={0}
                          max={order.totalAmount}
                          step={0.01}
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder={`Full: ${order.totalAmount}`}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium">Admin note (optional)</span>
                        <textarea
                          value={returnAdminNote}
                          onChange={(e) => setReturnAdminNote(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={orderActionPending}
                          onClick={() =>
                            approveReturn.mutate({
                              id: order._id,
                              refundAmount: refundAmount.trim()
                                ? Number(refundAmount)
                                : undefined,
                              adminNote: returnAdminNote.trim() || undefined,
                            })
                          }
                        >
                          {approveReturn.isPending ? 'Approving…' : 'Approve return'}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={orderActionPending}
                          onClick={() =>
                            rejectReturn.mutate({
                              id: order._id,
                              adminNote: returnAdminNote.trim() || undefined,
                            })
                          }
                        >
                          {rejectReturn.isPending ? 'Rejecting…' : 'Reject return'}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {order.status === 'delivered' &&
                  ['pending', 'processing'].includes(order.paymentStatus) ? (
                    <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <p className="text-sm font-medium">Cash on delivery</p>
                      <p className="text-xs text-zinc-600">
                        Mark payment received when customer pays on delivery.
                      </p>
                      <Button
                        className="w-full"
                        disabled={orderActionPending}
                        onClick={() => markPaymentReceived.mutate({ id: order._id })}
                      >
                        {markPaymentReceived.isPending ? 'Updating…' : 'Mark payment received'}
                      </Button>
                    </div>
                  ) : null}

                  {order.status !== 'return_requested' ? (
                    <>
                      <p className="text-sm font-medium">Update status</p>

                      {nextForward ? (
                        <Button
                          className="w-full"
                          disabled={orderActionPending}
                          onClick={advanceForward}
                        >
                          {updateStatus.isPending
                            ? 'Updating…'
                            : `Next: ${formatStatusLabel(nextForward)}`}
                        </Button>
                      ) : null}

                      {previousStep && isPipelineBackward(order.status, previousStep) ? (
                        <Button
                          variant="secondary"
                          className="w-full"
                          disabled={orderActionPending}
                          onClick={openRevertDialog}
                        >
                          Back to {formatStatusLabel(previousStep)}
                        </Button>
                      ) : null}

                      {canCancelFrom(order.status) ? (
                        <Button
                          variant="danger"
                          disabled={orderActionPending}
                          onClick={() =>
                            updateStatus.mutate({ id: order._id, status: 'cancelled' })
                          }
                        >
                          Cancel order
                        </Button>
                      ) : null}
                    </>
                  ) : null}

                  {updateStatus.isError || approveReturn.isError || rejectReturn.isError ? (
                    <p className="text-sm text-red-600">
                      {(updateStatus.error ??
                        approveReturn.error ??
                        rejectReturn.error) instanceof Error
                        ? (
                            updateStatus.error ??
                            approveReturn.error ??
                            rejectReturn.error
                          )?.message
                        : 'Update failed'}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {revertDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revert-dialog-title"
          >
            <h3 id="revert-dialog-title" className="text-lg font-semibold text-zinc-900">
              Move order back to {formatStatusLabel(revertDialog.to)}?
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              You are reverting from{' '}
              <span className="font-medium capitalize">{revertDialog.from}</span> to{' '}
              <span className="font-medium capitalize">{revertDialog.to}</span>. Please explain
              why this order is going back.
            </p>
            <label className="mt-4 block space-y-1.5">
              <span className="text-sm font-medium">Comment (required)</span>
              <textarea
                value={revertComment}
                onChange={(e) => setRevertComment(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="e.g. Customer requested to hold the order"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setRevertDialog(null);
                  setRevertComment('');
                }}
                disabled={updateStatus.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRevert}
                disabled={updateStatus.isPending || revertComment.trim().length < 3}
              >
                {updateStatus.isPending ? 'Saving…' : 'Confirm revert'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
