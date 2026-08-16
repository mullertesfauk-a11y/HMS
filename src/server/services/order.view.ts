import "server-only";

/**
 * Public order view.
 *
 * The order entity (with internal ids and audit trail) is internal. This
 * mapper produces the minimum safe surface for guests:
 *  - NO internal database ids
 *  - NO staff / audit internals
 *  - totals as plain numbers
 */

export interface PublicOrderViewItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PublicOrderView {
  orderNumber: string;
  status: string;
  guestName: string;
  deliveryNotes: string | null;
  items: PublicOrderViewItem[];
  pricing: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  };
  createdAt: string;
}

export function toPublicOrderView(order: {
  orderNumber: string;
  status: string;
  guestName: string;
  deliveryNotes: string | null;
  subtotal: { toNumber(): number } | number;
  tax: { toNumber(): number } | number;
  total: { toNumber(): number } | number;
  currency: string;
  createdAt: Date;
  items: {
    itemName: string;
    quantity: number;
    unitPrice: { toNumber(): number } | number;
    subtotal: { toNumber(): number } | number;
  }[];
}): PublicOrderView {
  const toNumber = (value: { toNumber(): number } | number) =>
    typeof value === "number" ? value : value.toNumber();

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    guestName: order.guestName,
    deliveryNotes: order.deliveryNotes,
    items: order.items.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      subtotal: toNumber(item.subtotal),
    })),
    pricing: {
      subtotal: toNumber(order.subtotal),
      tax: toNumber(order.tax),
      total: toNumber(order.total),
      currency: order.currency,
    },
    createdAt: order.createdAt.toISOString(),
  };
}
