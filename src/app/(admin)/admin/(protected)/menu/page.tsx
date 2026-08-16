import { Card, CardContent } from "@/components/ui/card";
import { CategoryManager, type CategoryRow } from "@/components/admin/menu/category-manager";
import { MenuItemsSection, type MenuItemFormValue } from "@/components/admin/menu/menu-items-section";
import { MenuToolbar } from "@/components/admin/menu/menu-toolbar";
import type { TableSort } from "@/components/admin/data-table";
import { buildPaginationMeta, parsePaginationQuery } from "@/lib/api/pagination";
import { requirePermissionPage } from "@/lib/permissions";
import { adminMenuItemListSchema, parseListQuery } from "@/lib/validation/admin";
import { menuService } from "@/server/services/menu.service";
import { hotelService } from "@/server/services/hotel.service";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermissionPage("menu.read");
  const hotel = await hotelService.getDefaultHotel();
  const rawParams = await searchParams;

  let query: ReturnType<typeof parseListQuery<typeof adminMenuItemListSchema>>;
  try {
    query = parseListQuery(adminMenuItemListSchema, rawParams);
  } catch {
    query = parseListQuery(adminMenuItemListSchema, {});
  }

  const { page, pageSize, skip, take, sortOrder } = parsePaginationQuery({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  const orderByMap: Record<string, object> = {
    name: { name: sortOrder },
    price: { price: sortOrder },
    sortOrder: { sortOrder: sortOrder },
    updatedAt: { updatedAt: sortOrder },
  };
  const sort: TableSort | null = query.sortBy
    ? { id: query.sortBy, desc: sortOrder === "desc" }
    : null;

  const [categories, { items, total }] = await Promise.all([
    menuService.listCategories(),
    menuService.listItems({
      search: query.search,
      categoryId: query.categoryId,
      isAvailable: query.isAvailable,
      skip,
      take,
      orderBy:
        (query.sortBy && orderByMap[query.sortBy]) || [{ sortOrder: "asc" as const }],
    }),
  ]);

  const categoryRows: CategoryRow[] = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    nameAm: category.nameAm,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    itemCount: category._count.items,
  }));

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const itemRows: MenuItemFormValue[] = items.map((item) => ({
    id: item.id,
    slug: item.slug,
    categoryId: item.categoryId,
    name: item.name,
    nameAm: item.nameAm,
    description: item.description,
    descriptionAm: item.descriptionAm,
    price: item.price.toNumber(),
    image: item.image,
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    dietaryTags: item.dietaryTags,
    badges: item.badges,
    sortOrder: item.sortOrder,
  }));

  const meta = buildPaginationMeta(page, pageSize, total);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Menu</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Manage restaurant categories, items, prices, and availability.
        </p>
      </div>

      <MenuToolbar categories={categoryOptions} />

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardContent className="p-5">
            <CategoryManager categories={categoryRows} />
          </CardContent>
        </Card>

        <div className="space-y-3 xl:col-span-2">
          <MenuItemsSection
            items={itemRows}
            categories={categoryOptions}
            currency={hotel.currency}
            sort={sort}
            page={meta.page}
            pageSize={meta.pageSize}
            total={meta.total}
            totalPages={meta.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
