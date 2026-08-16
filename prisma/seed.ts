import "dotenv/config";
import { randomUUID } from "node:crypto";

import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { MENU_CATEGORIES, MENU_ITEMS } from "./seed-data/menu";

/**
 * Development seed data.
 *
 * Run with: npx prisma db seed
 * (configured in prisma.config.ts → migrations.seed)
 *
 * ⚠️ The credentials below are DEVELOPMENT-ONLY. Never use them in production.
 *   admin@example.com / Admin123!  (ADMIN)
 *   staff@example.com / Staff123!  (STAFF)
 *
 * The seed is idempotent — safe to re-run.
 */

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed. Copy .env.example to .env first.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
});

const HOTEL = {
  name: "Gurja Hotel",
  slug: "gurja-hotel",
  description:
    "A prestigious sanctuary of refined luxury, curated suites, exquisite dining, and elevated Ethiopian hospitality in Shire, Tigray.",
  address: "Central Shire",
  city: "Shire, Tigray",
  country: "Ethiopia",
  phone: "+251 34 000 0000",
  email: "reservations@gurjahotel.example",
  currency: "ETB",
  timezone: "Africa/Addis_Ababa",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  taxRate: 15,
} as const;

const AMENITIES = [
  { name: "Wi-Fi", slug: "wifi", icon: "wifi" },
  { name: "Air Conditioning", slug: "air-conditioning", icon: "snowflake" },
  { name: "TV", slug: "tv", icon: "tv" },
  { name: "Breakfast", slug: "breakfast", icon: "coffee" },
  { name: "Mini Bar", slug: "mini-bar", icon: "wine" },
  { name: "Parking", slug: "parking", icon: "car" },
] as const;

const ROOM_TYPES = [
  {
    name: "Standard Room",
    slug: "standard-room",
    description: "Comfortable and functional, ideal for solo travelers and short stays.",
    capacity: 2,
    maxAdults: 2,
    maxChildren: 1,
    bedType: "1 Queen Bed",
    size: "22 m²",
    basePrice: 3200,
    amenities: ["wifi", "air-conditioning", "tv"],
    rooms: [
      { roomNumber: "101", floor: 1 },
      { roomNumber: "102", floor: 1 },
      { roomNumber: "103", floor: 1 },
    ],
  },
  {
    name: "Deluxe Room",
    slug: "deluxe-room",
    description: "Spacious room with city views, ideal for couples and business guests.",
    capacity: 3,
    maxAdults: 2,
    maxChildren: 2,
    bedType: "1 King Bed",
    size: "30 m²",
    basePrice: 4800,
    amenities: ["wifi", "air-conditioning", "tv", "breakfast"],
    rooms: [
      { roomNumber: "201", floor: 2 },
      { roomNumber: "202", floor: 2 },
      { roomNumber: "203", floor: 2 },
    ],
  },
  {
    name: "Suite",
    slug: "suite",
    description: "Separate living area, premium amenities, and personalized service.",
    capacity: 4,
    maxAdults: 3,
    maxChildren: 2,
    bedType: "1 King Bed + Sofa Bed",
    size: "48 m²",
    basePrice: 8500,
    amenities: ["wifi", "air-conditioning", "tv", "breakfast", "mini-bar"],
    rooms: [
      { roomNumber: "301", floor: 3 },
      { roomNumber: "302", floor: 3 },
    ],
  },
] as const;

/** Kebab-case slug used as the stable public reference for menu items. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🌱 Seeding database…");

  // Hotel
  const hotel = await prisma.hotel.upsert({
    where: { slug: HOTEL.slug },
    update: { ...HOTEL },
    create: { ...HOTEL },
  });
  console.log(`  • Hotel: ${hotel.name} (${hotel.id})`);

  // Amenities
  const amenityIds = new Map<string, string>();
  for (const amenity of AMENITIES) {
    const record = await prisma.amenity.upsert({
      where: { slug: amenity.slug },
      update: { name: amenity.name, icon: amenity.icon },
      create: { ...amenity },
    });
    amenityIds.set(amenity.slug, record.id);
  }
  console.log(`  • Amenities: ${AMENITIES.length}`);

  // Room types + rooms
  for (const rt of ROOM_TYPES) {
    const roomType = await prisma.roomType.upsert({
      where: { hotelId_slug: { hotelId: hotel.id, slug: rt.slug } },
      update: {
        name: rt.name,
        description: rt.description,
        capacity: rt.capacity,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        bedType: rt.bedType,
        size: rt.size,
        basePrice: rt.basePrice,
      },
      create: {
        hotelId: hotel.id,
        name: rt.name,
        slug: rt.slug,
        description: rt.description,
        capacity: rt.capacity,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        bedType: rt.bedType,
        size: rt.size,
        basePrice: rt.basePrice,
      },
    });

    // Amenity links
    for (const slug of rt.amenities) {
      const amenityId = amenityIds.get(slug);
      if (!amenityId) continue;
      await prisma.roomTypeAmenity.upsert({
        where: { roomTypeId_amenityId: { roomTypeId: roomType.id, amenityId } },
        update: {},
        create: { roomTypeId: roomType.id, amenityId },
      });
    }

    // Physical rooms
    for (const room of rt.rooms) {
      await prisma.room.upsert({
        where: { hotelId_roomNumber: { hotelId: hotel.id, roomNumber: room.roomNumber } },
        update: { roomTypeId: roomType.id, floor: room.floor },
        create: {
          hotelId: hotel.id,
          roomTypeId: roomType.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
        },
      });
    }
    console.log(`  • Room type: ${rt.name} (${rt.rooms.length} rooms)`);
  }

  // Menu categories + items
  //
  // The public site serves the FIRST hotel (hotelService.getDefaultHotel), so
  // the menu must live under that hotel — on a transitional dev DB (an older
  // pre-rebrand hotel created first) this differs from the hotel upserted
  // above. On a fresh DB they are the same hotel.
  const menuHotel = (await prisma.hotel.findFirst({ orderBy: { createdAt: "asc" } })) ?? hotel;
  const menuCategoryIds = new Map<string, string>();
  for (const category of MENU_CATEGORIES) {
    const record = await prisma.menuCategory.upsert({
      where: { hotelId_slug: { hotelId: menuHotel.id, slug: category.id } },
      update: {
        name: category.name,
        nameAm: category.nameAm,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
      create: {
        hotelId: menuHotel.id,
        slug: category.id,
        name: category.name,
        nameAm: category.nameAm,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
    });
    menuCategoryIds.set(category.id, record.id);
  }
  console.log(`  • Menu categories: ${MENU_CATEGORIES.length}`);

  for (const item of MENU_ITEMS) {
    const categoryId = menuCategoryIds.get(item.categoryId);
    if (!categoryId) continue;
    const slug = slugify(item.name);
    await prisma.menuItem.upsert({
      where: { hotelId_slug: { hotelId: menuHotel.id, slug } },
      update: {
        categoryId,
        name: item.name,
        nameAm: item.nameAm,
        description: item.description,
        price: item.price,
        image: item.image ?? null,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        dietaryTags: item.dietaryTags,
        badges: item.badges,
        sortOrder: item.sortOrder,
      },
      create: {
        hotelId: menuHotel.id,
        categoryId,
        slug,
        name: item.name,
        nameAm: item.nameAm,
        description: item.description,
        price: item.price,
        image: item.image ?? null,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        dietaryTags: item.dietaryTags,
        badges: item.badges,
        sortOrder: item.sortOrder,
      },
    });
  }
  console.log(`  • Menu items: ${MENU_ITEMS.length}`);

  // Staff users (Better Auth User + Account rows)
  const staff = [
    {
      name: "Hotel Admin",
      email: "admin@example.com",
      password: "Admin123!",
      role: "ADMIN" as const,
    },
    {
      name: "Front Desk Staff",
      email: "staff@example.com",
      password: "Staff123!",
      role: "STAFF" as const,
    },
  ];

  for (const user of staff) {
    const id = randomUUID();
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    const passwordHash = await hashPassword(user.password);

    if (existing) {
      await prisma.user.update({
        where: { email: user.email },
        data: { name: user.name, role: user.role, status: "ACTIVE" },
      });
      await prisma.account.updateMany({
        where: { userId: existing.id, providerId: "credential" },
        data: { password: passwordHash },
      });
      console.log(`  • User (updated): ${user.email} [${user.role}]`);
    } else {
      await prisma.user.create({
        data: {
          id,
          name: user.name,
          email: user.email,
          emailVerified: true,
          role: user.role,
          status: "ACTIVE",
          accounts: {
            create: {
              id: randomUUID(),
              accountId: id,
              providerId: "credential",
              password: passwordHash,
            },
          },
        },
      });
      console.log(`  • User (created): ${user.email} [${user.role}]`);
    }
  }

  console.log("✅ Seed complete.");
  console.log("   ⚠️  Dev-only credentials — admin@example.com / Admin123!, staff@example.com / Staff123!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
