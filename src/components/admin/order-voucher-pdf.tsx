'use client';

import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import type { Order } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 4, fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  section: { marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  tableRow: { flexDirection: 'row', marginBottom: 3 },
  colItem: { width: '45%' },
  colQty: { width: '15%', textAlign: 'right' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, fontWeight: 'bold' },
});

function OrderVoucherDocument({ order }: { order: Order }) {
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : '—';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Order Voucher</Text>
        <Text style={styles.subtitle}>{order.orderNumber}</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Date</Text>
            <Text>{created}</Text>
          </View>
          <View style={styles.row}>
            <Text>Channel</Text>
            <Text>{order.channel?.toUpperCase() ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text>Status</Text>
            <Text>{order.status}</Text>
          </View>
          <View style={styles.row}>
            <Text>Payment</Text>
            <Text>
              {order.paymentMethod} · {order.paymentStatus}
            </Text>
          </View>
        </View>

        {order.addressSnapshot ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            <Text>{order.addressSnapshot.name}</Text>
            <Text>{order.addressSnapshot.phone}</Text>
            <Text>
              {order.addressSnapshot.localLocation}, {order.addressSnapshot.thana},{' '}
              {order.addressSnapshot.city}, {order.addressSnapshot.state}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Product</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {(order.items ?? []).map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colItem}>
                {item.productTitle}
                {item.sku ? ` (${item.sku})` : ''}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>৳{item.unitPrice}</Text>
              <Text style={styles.colTotal}>৳{item.lineSubtotal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          {order.couponCode ? (
            <View style={styles.row}>
              <Text>Coupon ({order.couponCode})</Text>
              <Text>-৳{order.couponDiscountAmount ?? 0}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>Grand total: ৳{order.totalAmount}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadOrderVoucher(order: Order) {
  const blob = await pdf(<OrderVoucherDocument order={order} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${order.orderNumber}-voucher.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
