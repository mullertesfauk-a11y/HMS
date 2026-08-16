"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Bell,
  CheckCircle2,
  Clock,
  Heart,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  Utensils,
  Wallet,
  ChevronRight,
  Flame,
  Coffee,
  Salad,
  Cake,
  Wine,
  Sparkle,
} from "lucide-react";

import type { PublicHotel, PublicRoomType } from "@/server/services/hotel.service";
import type { MenuCategory, MenuItem } from "@/lib/menu/menu-types";
import { formatMoney } from "@/lib/utils/display";
import { cn } from "@/lib/utils/cn";
import { MenuCart, type CartLine } from "@/components/website/menu/menu-cart";
import { MenuItemDetails } from "@/components/website/menu/menu-item-details";
import { MobileBottomNav } from "@/components/website/mobile-bottom-nav";

// Curated high quality food photos matching Ethiopian culinary heritage & hotel dining
const DEFAULT_FOOD_IMAGES: Record<string, string> = {
  "doro-wot":
    "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop",
  "special-doro-wat":
    "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop",
  "special-tibs":
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=900&auto=format&fit=crop",
  "beef-tibs-wrap":
    "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900&auto=format&fit=crop",
  kitfo:
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=900&auto=format&fit=crop",
  "shiro-wot":
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=900&auto=format&fit=crop",
  sambusa:
    "https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=900&auto=format&fit=crop",
  chechebsa:
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=900&auto=format&fit=crop",
  "breakfast-platter":
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900&auto=format&fit=crop",
};

const ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1500&auto=format&fit=crop",
];

// Preset preparation times and ratings for dishes
function getPrepTime(slug: string): string {
  if (slug.includes("doro") || slug.includes("wot")) return "25-35 min";
  if (slug.includes("tibs") || slug.includes("wrap")) return "15-25 min";
  if (slug.includes("kitfo")) return "15-20 min";
  if (slug.includes("breakfast") || slug.includes("chechebsa")) return "10-20 min";
  if (slug.includes("sambusa") || slug.includes("starter")) return "10-15 min";
  return "20-30 min";
}

function getRating(slug: string): { score: string; count: number } {
  if (slug.includes("doro")) return { score: "3.0", count: 1 };
  if (slug.includes("tibs")) return { score: "4.0", count: 1 };
  if (slug.includes("kitfo")) return { score: "4.8", count: 8 };
  if (slug.includes("shiro")) return { score: "4.5", count: 5 };
  return { score: "4.0", count: 2 };
}

export interface LandingFeedProps {
  hotel: PublicHotel;
  roomTypes: PublicRoomType[];
  categories: MenuCategory[];
  items: MenuItem[];
}

export function LandingFeed({ hotel, roomTypes, categories, items }: LandingFeedProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [favorites, setFavorites] = React.useState<Set<string>>(
    () => new Set(["ethiopian-1", "deluxe-room"]),
  );
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null);
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [bellOpen, setBellOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addToCart = React.useCallback((item: MenuItem, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.slug === item.slug);
      if (existing) {
        return prev.map((line) =>
          line.slug === item.slug ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }
      return [...prev, { slug: item.slug, name: item.name, price: item.price, quantity }];
    });
  }, []);

  const updateQuantity = React.useCallback((slug: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.slug !== slug)
        : prev.map((line) => (line.slug === slug ? { ...line, quantity } : line)),
    );
  }, []);

  const removeFromCart = React.useCallback((slug: string) => {
    setCart((prev) => prev.filter((line) => line.slug !== slug));
  }, []);

  const clearCart = React.useCallback(() => setCart([]), []);

  const totalCartCount = cart.reduce((acc, line) => acc + line.quantity, 0);

  // Filter items by category and search
  const filteredItems = React.useMemo(() => {
    let result = items;

    if (activeCategory !== "all" && activeCategory !== "rooms") {
      result = result.filter((i) => i.categoryId === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.nameAm.includes(query) ||
          i.description.toLowerCase().includes(query),
      );
    }

    return result;
  }, [items, activeCategory, searchQuery]);

  const popularItems = React.useMemo(() => {
    if (activeCategory !== "all" && activeCategory !== "rooms") {
      return filteredItems;
    }
    const featured = items.filter((i) => i.isFeatured || i.badges.includes("popular"));
    return featured.length > 0 ? featured : items.slice(0, 6);
  }, [items, filteredItems, activeCategory]);

  const recommendedItems = React.useMemo(() => {
    if (activeCategory !== "all" && activeCategory !== "rooms") {
      return filteredItems.slice(popularItems.length);
    }
    return items.filter((i) => !popularItems.slice(0, 3).includes(i)).slice(0, 6);
  }, [items, filteredItems, popularItems, activeCategory]);

  // Combined category pills with icons
  const allDisplayCategories = React.useMemo(() => {
    const defaultIcons: Record<string, React.ReactNode> = {
      all: <Sparkles className="h-4 w-4 text-brand-brass" />,
      ethiopian: <Utensils className="h-4 w-4 text-brand-brass" />,
      main: <Flame className="h-4 w-4 text-brand-brass" />,
      starters: <Sparkle className="h-4 w-4 text-brand-brass" />,
      rooms: <BedDouble className="h-4 w-4 text-brand-brass" />,
      breakfast: <Coffee className="h-4 w-4 text-brand-brass" />,
      vegetarian: <Salad className="h-4 w-4 text-brand-brass" />,
      desserts: <Cake className="h-4 w-4 text-brand-brass" />,
      drinks: <Wine className="h-4 w-4 text-brand-brass" />,
    };

    const list = [
      { id: "all", slug: "all", name: "All", icon: defaultIcons.all },
      { id: "ethiopian", slug: "ethiopian", name: "Traditional", icon: defaultIcons.ethiopian },
      { id: "main", slug: "main", name: "Mains", icon: defaultIcons.main },
      { id: "starters", slug: "starters", name: "Fast Food", icon: defaultIcons.starters },
      { id: "rooms", slug: "rooms", name: "Suites & Rooms", icon: defaultIcons.rooms },
    ];

    for (const cat of categories) {
      if (!list.some((c) => c.id === cat.id)) {
        list.push({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          icon: defaultIcons[cat.id] || <Utensils className="h-4 w-4 text-brand-brass" />,
        });
      }
    }

    return list;
  }, [categories]);

  return (
    <div className="min-h-screen bg-stone-50/60 pb-24 md:pb-16 text-stone-900 selection:bg-brand-light selection:text-brand">
      {/* ── Main Feed Body ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-8">
        {/* Top Search & Welcome Banner */}
        <div className="mb-6 rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-stone-900">
                Artisanal Dining &amp; Bespoke Suites
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-xl">
                Experience authentic Ethiopian warmth, organic farm-to-table cuisine, and luxury accommodations at {hotel.name || "Gurja Hotel"}.
              </p>
            </div>

            {/* Integrated Search Bar & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search dishes or suites…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/70 py-2.5 pl-9 pr-4 text-xs font-medium focus:border-brand focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              {totalCartCount > 0 && (
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  aria-label="Open Shopping Cart"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-dark active:scale-95"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Cart ({totalCartCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Categories Pill Carousel ─────────────────────────────────────── */}
        <section className="mb-6" aria-labelledby="categories-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="categories-heading" className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
              Categories
            </h2>
            <Link
              href="/menu"
              className="text-xs font-semibold text-brand-brass hover:text-brand transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Horizontal scrollable pills with scrollbar hidden */}
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {allDisplayCategories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-all active:scale-95",
                    isSelected
                      ? "border-brand bg-brand text-white shadow-md shadow-brand/20"
                      : "border-stone-200/80 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50",
                  )}
                >
                  <span className={cn(isSelected ? "text-white" : "")}>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 1ST HORIZONTAL SCROLLABLE LIST: ROOMS & SUITES (User Requirement) ── */}
        {(activeCategory === "all" || activeCategory === "rooms") && (
          <section className="mb-8" aria-labelledby="rooms-heading">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 id="rooms-heading" className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                  Suites &amp; Accommodations
                </h2>
                <p className="text-xs text-stone-500 font-medium hidden sm:block">
                  Curated sanctuaries of rest with city &amp; mountain vistas
                </p>
              </div>
              <Link
                href="/rooms"
                className="text-xs font-semibold text-brand-brass hover:text-brand transition-colors"
              >
                View all
              </Link>
            </div>

            {/* Horizontal Scroll Carousel for Rooms */}
            <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {roomTypes.map((room, index) => {
                const photo = room.imageUrl ?? ROOM_IMAGES[index % ROOM_IMAGES.length];
                const isFav = favorites.has(room.slug);

                return (
                  <div
                    key={room.slug}
                    className="group relative flex w-[260px] sm:w-[290px] md:w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-brass/40"
                  >
                    {/* Room Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={photo}
                        alt={room.name}
                        fill
                        sizes="(max-width: 768px) 260px, 320px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />

                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(room.slug, e)}
                        aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition-transform hover:scale-110 active:scale-90"
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isFav ? "fill-rose-500 text-rose-500" : "text-stone-600",
                          )}
                        />
                      </button>

                      {/* Price Badge on Image */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-stone-900 shadow-md backdrop-blur-md">
                          <span className="text-brand-brass mr-1">{hotel.currency}</span>
                          {room.basePrice.toLocaleString()}
                          <span className="ml-1 text-[10px] font-normal text-stone-500">/ night</span>
                        </span>
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="flex flex-1 flex-col pt-3 px-1">
                      <Link href={`/rooms/${room.slug}`}>
                        <h3 className="text-base font-bold text-stone-900 transition-colors group-hover:text-brand line-clamp-1">
                          {room.name}
                        </h3>
                      </Link>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                        <BedDouble className="h-3.5 w-3.5 text-stone-400" />
                        <span className="line-clamp-1">{room.bedType}</span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-xs text-stone-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-stone-400" />
                          <span>Up to {room.maxAdults} guests</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-800 font-semibold">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>4.9</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                          {room.size ?? "Spacious"}
                        </span>
                        <Link
                          href={`/rooms/${room.slug}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand active:scale-95"
                        >
                          <span>Explore</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 2ND HORIZONTAL SCROLLABLE LIST: POPULAR NEAR YOU ───────────────── */}
        {activeCategory !== "rooms" && (
          <section className="mb-8" aria-labelledby="popular-heading">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 id="popular-heading" className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                  Popular Near You
                </h2>
                <p className="text-xs text-stone-500 font-medium hidden sm:block">
                  Chef-curated Ethiopian specialties &amp; gourmet classics
                </p>
              </div>
              <Link
                href="/menu"
                className="text-xs font-semibold text-brand-brass hover:text-brand transition-colors"
              >
                View all
              </Link>
            </div>

            {/* Horizontal Scroll Carousel for Dishes */}
            <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              {popularItems.map((item) => {
                const photo =
                  item.image ||
                  DEFAULT_FOOD_IMAGES[item.slug] ||
                  "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop";
                const isFav = favorites.has(item.slug);
                const prepTime = getPrepTime(item.slug);
                const rating = getRating(item.slug);

                return (
                  <div
                    key={item.id}
                    className="group relative flex w-[210px] sm:w-[240px] md:w-[260px] shrink-0 flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-brass/40 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Food Photo Container */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={photo}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 210px, 260px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/30 via-transparent to-transparent" />

                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(item.slug, e)}
                        aria-label={isFav ? "Remove favorite" : "Add to favorites"}
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition-transform hover:scale-110 active:scale-90"
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isFav ? "fill-rose-500 text-rose-500" : "text-stone-600",
                          )}
                        />
                      </button>

                      {/* Price Badge on Photo */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-brass shadow-md backdrop-blur-md">
                          {hotel.currency} {item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Dish Info */}
                    <div className="flex flex-1 flex-col pt-3 px-1">
                      <h3 className="text-base font-bold text-stone-900 transition-colors group-hover:text-brand line-clamp-1">
                        {item.name}
                      </h3>

                      {/* Prep time */}
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        <span>{prepTime}</span>
                      </div>

                      {/* Rating and Plus Button Row */}
                      <div className="mt-3 flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-stone-800">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>
                            {rating.score}{" "}
                            <span className="font-normal text-stone-400">({rating.count})</span>
                          </span>
                        </div>

                        {/* Orange/Brand Accent Plus Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item, 1);
                          }}
                          aria-label={`Add ${item.name} to order`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-dark hover:scale-105 active:scale-95"
                        >
                          <Plus className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── RECOMMENDED FOR YOU SECTION (Vertical Stack Cards) ──────────────── */}
        {activeCategory !== "rooms" && recommendedItems.length > 0 && (
          <section className="mb-10" aria-labelledby="recommended-heading">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="recommended-heading" className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                  Recommended For You
                </h2>
                <p className="text-xs text-stone-500 font-medium hidden sm:block">
                  Hand-crafted delicacies prepared fresh upon request
                </p>
              </div>
              <Link
                href="/menu"
                className="text-xs font-semibold text-brand-brass hover:text-brand transition-colors"
              >
                View all
              </Link>
            </div>

            {/* List of horizontal cards */}
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {recommendedItems.map((item) => {
                const photo =
                  item.image ||
                  DEFAULT_FOOD_IMAGES[item.slug] ||
                  "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop";
                const isFav = favorites.has(item.slug);
                const prepTime = getPrepTime(item.slug);
                const rating = getRating(item.slug);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group flex items-center gap-3.5 rounded-3xl border border-stone-200/80 bg-white p-3 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-brand-brass/40 cursor-pointer"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={photo}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 96px, 112px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Content Details */}
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 transition-colors group-hover:text-brand line-clamp-1">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(item.slug, e)}
                          aria-label={isFav ? "Remove favorite" : "Add to favorites"}
                          className="text-stone-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              isFav ? "fill-rose-500 text-rose-500" : "text-stone-400",
                            )}
                          />
                        </button>
                      </div>

                      {/* Rating & Prep time */}
                      <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
                        <div className="flex items-center gap-1 font-semibold text-stone-800">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>
                            {rating.score}{" "}
                            <span className="font-normal text-stone-400">({rating.count})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-400">
                          <Clock className="h-3 w-3" />
                          <span>{prepTime}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Price & Add */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-brass">
                          {formatMoney(item.price, hotel.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item, 1);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white shadow-xs hover:bg-brand-dark transition-all active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Luxury Pillars & Hotel Trust Bar ───────────────────────────────── */}
        <section className="mt-6 border-t border-stone-200/80 pt-8 pb-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-stone-200/60 shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Best Rate Direct
                </p>
                <p className="text-[11px] text-stone-500">
                  Direct booking guarantee &amp; bespoke room upgrades
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-stone-200/60 shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Authentic Dining
                </p>
                <p className="text-[11px] text-stone-500">
                  Prepared with organic Tigrayan spices &amp; pure butter
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-stone-200/60 shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  24/7 Dedicated Care
                </p>
                <p className="text-[11px] text-stone-500">
                  In-room service and round-the-clock concierge
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Fixed Mobile Bottom Navigation Bar ──────────────────────────────── */}
      <MobileBottomNav
        cartCount={totalCartCount}
        onOpenOrders={() => setCartOpen(true)}
      />

      {/* ── Floating Cart Bar on Mobile when items are present ──────────────── */}
      {totalCartCount > 0 && (
        <div className="fixed inset-x-0 bottom-18 z-30 px-4 md:bottom-6 md:px-8 pointer-events-none">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-full bg-stone-900 py-3 pl-5 pr-3 text-white shadow-2xl transition-all hover:bg-brand active:scale-98"
          >
            <span className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <ShoppingBag className="h-4 w-4 text-brand-brass" />
              {totalCartCount} {totalCartCount === 1 ? "dish" : "dishes"} selected
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-bold text-amber-200">
                {formatMoney(
                  cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                  hotel.currency,
                )}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
                Review Order
              </span>
            </span>
          </button>
        </div>
      )}

      {/* ── Item Details Bottom Sheet / Dialog ──────────────────────────────── */}
      {selectedItem && (
        <MenuItemDetails
          item={selectedItem}
          currency={hotel.currency}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* ── Cart Drawer / Dialog ────────────────────────────────────────────── */}
      {cartOpen && (
        <MenuCart
          lines={cart}
          currency={hotel.currency}
          taxRate={hotel.taxRate}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
