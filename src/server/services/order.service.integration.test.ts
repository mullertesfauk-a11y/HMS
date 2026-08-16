import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { orderService } from "@/server/services/order.service";
import { menuRepository } from "@/server/repositories/menu.repository";

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("order service (DB)", () => {
  const createdOrderNumbers: string[] = [];
  const createdMenuIds: string[] = [];
  let hotelId = "";
  let currency = "ETB";
  let taxRate = 0;

  // Stable seeded items: Doro Wot (available), Baklava (unavailable).
  let doroSlug = "";
  let sambusaSlug = "";
  let baklavaSlug = "";

  async function findBySlug(slug: string) {
    const item = await menuRepository.findItemBySlug(hotelId, slug);
    if (!item) throw new Error(`Test fixture missing: ${slug}`);
    return item;
  }

  beforeAll(async () => {
    const hotel = await prisma.hotel.findFirst({ orderBy: { createdAt: "asc" } });
    if (!hotel) throw new Error("Seed data missing — run `npx prisma db seed` first");
    hotelId = hotel.id;
    currency = hotel.currency;
    taxRate = hotel.taxRate.toNumber();

    const doro = await findBySlug("doro-wot");
    doroSlug = doro.slug;
    const sambusa = await findBySlug("sambusa");
    sambusaSlug = sambusa.slug;
    const baklava = await findBySlug("baklava");
    baklavaSlug = baklava.slug;

    // Clean leftovers from interrupted runs.
    await prisma.order.deleteMany({
      where: { guestPhone: { contains: "order-test-" } },
    });
  });

  afterAll(async () => {
    if (createdOrderNumbers.length > 0) {
      await prisma.order.deleteMany({
        where: { orderNumber: { in: createdOrderNumbers } },
      });
    }
    if (createdMenuIds.length > 0) {
      await prisma.menuItem.deleteMany({ where: { id: { in: createdMenuIds } } });
      // The test category is the parent of the test item; remove it if empty.
      const testItem = await prisma.menuItem.findFirst({
        where: { slug: "order-test-item" },
        select: { id: true },
      });
      if (!testItem) {
        await prisma.menuCategory.deleteMany({ where: { slug: "order-test-cat" } });
      }
    }
    await prisma.$disconnect();
  });

  it("creates an order with server-side pricing, snapshots, and audit", async () => {
    const doro = await findBySlug(doroSlug);
    const sambusa = await findBySlug(sambusaSlug);

    const order = await orderService.createOrder(
      {
        guestName: "Order Tester",
        guestPhone: "order-test-1",
        deliveryNotes: "Leave at reception",
        items: [
          { slug: doroSlug, quantity: 2 },
          { slug: sambusaSlug, quantity: 1 },
        ],
      },
      { hotelId, currency, taxRate, ipAddress: "127.0.0.1" },
    );
    createdOrderNumbers.push(order.orderNumber);

    expect(order.orderNumber).toMatch(/^ORD-\d{4}-[A-Z0-9]{6}$/);
    expect(order.status).toBe("PLACED");
    expect(order.guestName).toBe("Order Tester");
    expect(order.deliveryNotes).toBe("Leave at reception");

    const doroPrice = doro.price.toNumber();
    const sambusaPrice = sambusa.price.toNumber();
    const expectedSubtotal = doroPrice * 2 + sambusaPrice;
    const expectedTax = Math.round(expectedSubtotal * (taxRate / 100));
    expect(order.subtotal.toNumber()).toBe(expectedSubtotal);
    expect(order.tax.toNumber()).toBe(expectedTax);
    expect(order.total.toNumber()).toBe(expectedSubtotal + expectedTax);

    // Line snapshots preserve the price at order time.
    expect(order.items).toHaveLength(2);
    const doroLine = order.items.find((item) => item.itemName === doro.name);
    expect(doroLine).toBeDefined();
    expect(doroLine?.quantity).toBe(2);
    expect(doroLine?.unitPrice.toNumber()).toBe(doroPrice);

    // Audit entry written in the same transaction.
    const audit = await prisma.auditLog.findFirst({
      where: { orderId: order.id, action: "order.created" },
    });
    expect(audit).not.toBeNull();
  });

  it("rejects an unavailable item", async () => {
    const order = orderService.createOrder(
      {
        guestName: "Unavailable",
        guestPhone: "order-test-2",
        items: [{ slug: baklavaSlug, quantity: 1 }],
      },
      { hotelId, currency, taxRate },
    );
    await expect(order).rejects.toThrow(ConflictError);
    await expect(order).rejects.toThrow(/unavailable/i);
  });

  it("rejects an unknown item slug", async () => {
    const order = orderService.createOrder(
      {
        guestName: "Ghost",
        guestPhone: "order-test-3",
        items: [{ slug: "does-not-exist", quantity: 1 }],
      },
      { hotelId, currency, taxRate },
    );
    await expect(order).rejects.toThrow(NotFoundError);
  });

  it("rejects items in an inactive category", async () => {
    const category = await prisma.menuCategory.create({
      data: {
        hotelId,
        slug: "order-test-cat",
        name: "Order Test Category",
        nameAm: "ሙከራ",
        sortOrder: 999,
        isActive: false,
      },
    });
    const item = await prisma.menuItem.create({
      data: {
        hotelId,
        categoryId: category.id,
        slug: "order-test-item",
        name: "Order Test Item",
        nameAm: "ሙከራ",
        description: "Used only by the order integration tests.",
        price: 100,
        isAvailable: true,
        isFeatured: false,
        dietaryTags: [],
        badges: [],
        sortOrder: 999,
      },
    });
    createdMenuIds.push(item.id);

    const order = orderService.createOrder(
      {
        guestName: "Hidden",
        guestPhone: "order-test-4",
        items: [{ slug: item.slug, quantity: 1 }],
      },
      { hotelId, currency, taxRate },
    );
    await expect(order).rejects.toThrow(ConflictError);
    await expect(order).rejects.toThrow(/no longer on the menu/i);
  });

  it("completes and cancels orders through the state machine", async () => {
    const created = await orderService.createOrder(
      {
        guestName: "State Machine",
        guestPhone: "order-test-5",
        items: [{ slug: doroSlug, quantity: 1 }],
      },
      { hotelId, currency, taxRate },
    );
    createdOrderNumbers.push(created.orderNumber);

    const completed = await orderService.transitionStatus(created.id, {
      status: "COMPLETED" as const,
    });
    expect(completed.status).toBe("COMPLETED");

    // Terminal states cannot be changed.
    await expect(
      orderService.transitionStatus(created.id, { status: "CANCELLED" as const }),
    ).rejects.toThrow(/Cannot transition/);

    const second = await orderService.createOrder(
      {
        guestName: "State Machine Two",
        guestPhone: "order-test-5b",
        items: [{ slug: sambusaSlug, quantity: 1 }],
      },
      { hotelId, currency, taxRate },
    );
    createdOrderNumbers.push(second.orderNumber);

    const cancelled = await orderService.transitionStatus(second.id, {
      status: "CANCELLED" as const,
    });
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("looks up by order number + phone (privacy gate)", async () => {
    const created = await orderService.createOrder(
      {
        guestName: "Find Me",
        guestPhone: "order-test-6",
        items: [{ slug: sambusaSlug, quantity: 1 }],
      },
      { hotelId, currency, taxRate },
    );
    createdOrderNumbers.push(created.orderNumber);

    const found = await orderService.lookup({
      orderNumber: created.orderNumber,
      guestPhone: "order-test-6",
    });
    expect(found.id).toBe(created.id);

    await expect(
      orderService.lookup({
        orderNumber: created.orderNumber,
        guestPhone: "wrong-phone",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
