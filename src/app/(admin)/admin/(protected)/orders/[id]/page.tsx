import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Phone, ReceiptText, UserRound } from "lucide-react";

import { OrderActions } from "@/components/admin/orders/order-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermissionPage } from "@/lib/permissions";
import { orderRepository } from "@/server/repositories/order.repository";
import { formatDateTime, formatMoney } from "@/lib/utils/display";

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    "order.created": "Order placed",
    "order.completed": "Marked completed",
    "order.cancelled": "Cancelled",
  };
  return labels[action] ?? action.replaceAll("_", " ");
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("orders.read");
  const { id } = await params;

  const order = await orderRepository.findById(id);
  if (!order) notFound();

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-lg font-semibold text-foreground">
              {order.orderNumber}
            </h1>
            <StatusBadge value={order.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {order.guestName} · {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
            {formatMoney(order.total, order.currency)} ·{" "}
            {formatDateTime(order.createdAt)}
          </p>
        </div>

        <OrderActions orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText aria-hidden className="h-4 w-4 text-stone-400" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-stone-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatMoney(item.unitPrice, order.currency)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatMoney(item.subtotal, order.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-2 space-y-2 border-t border-stone-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Subtotal</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(order.subtotal, order.currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Tax</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(order.tax, order.currency)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-2 text-base">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-semibold text-foreground">
                    {formatMoney(order.total, order.currency)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {order.deliveryNotes ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList aria-hidden className="h-4 w-4 text-stone-400" />
                  Delivery notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-stone-700">
                  {order.deliveryNotes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound aria-hidden className="h-4 w-4 text-stone-400" />
                Guest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Name
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">{order.guestName}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                    <Phone aria-hidden className="h-3 w-3" />
                    Phone
                  </dt>
                  <dd className="mt-0.5 text-stone-700">{order.guestPhone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Placed
                  </dt>
                  <dd className="mt-0.5 text-stone-700">{formatDateTime(order.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList aria-hidden className="h-4 w-4 text-stone-400" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.auditLogs.length === 0 ? (
                <p className="text-sm text-stone-500">No activity recorded yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-stone-200 pl-4">
                  {order.auditLogs.map((log) => (
                    <li key={log.id} className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand"
                      />
                      <p className="text-sm font-medium text-foreground">
                        {actionLabel(log.action)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDateTime(log.createdAt)}
                        {log.user ? ` · ${log.user.name}` : log.userId ? " · Staff" : " · Guest"}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
