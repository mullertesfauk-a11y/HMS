"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/menu/image-upload";
import { DIETARY_TAGS, MENU_ITEM_BADGES } from "@/lib/menu/menu-types";
import {
  createItem,
  updateItem,
} from "@/app/(admin)/admin/(protected)/menu/actions";

export interface MenuItemFormValue {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  nameAm: string;
  description: string;
  descriptionAm: string | null;
  price: number;
  image: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  dietaryTags: string[];
  badges: string[];
  sortOrder: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  spicy: "Spicy",
  "gluten-free": "Gluten-free",
  "contains-dairy": "Contains dairy",
  "contains-nuts": "Contains nuts",
  "contains-garlic": "Contains garlic",
};

const BADGE_LABELS: Record<string, string> = {
  popular: "Popular",
  "chef-pick": "Chef's pick",
  new: "New",
};

export function MenuItemForm({
  categories,
  item,
  onClose,
}: {
  categories: { id: string; name: string }[];
  item?: MenuItemFormValue;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(item?.name ?? "");
  const [nameAm, setNameAm] = useState(item?.nameAm ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? categories[0]?.id ?? "",
  );
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [descriptionAm, setDescriptionAm] = useState(item?.descriptionAm ?? "");
  const [image, setImage] = useState(item?.image ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);
  const [dietaryTags, setDietaryTags] = useState<string[]>(item?.dietaryTags ?? []);
  const [badges, setBadges] = useState<string[]>(item?.badges ?? []);
  const [sortOrder, setSortOrder] = useState(
    item ? String(item.sortOrder) : "0",
  );

  function handleNameChange(value: string) {
    setName(value);
    if (!item) setSlug(slugify(value));
  }

  function toggleTag(tag: string) {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function toggleBadge(badge: string) {
    setBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setError("Enter a valid price");
      return;
    }

    startTransition(async () => {
      const input = {
        slug: slug.trim(),
        categoryId,
        name: name.trim(),
        nameAm: nameAm.trim(),
        description: description.trim(),
        descriptionAm: descriptionAm.trim() || undefined,
        price: priceValue,
        image: image.trim() || undefined,
        isAvailable,
        isFeatured,
        dietaryTags,
        badges,
        sortOrder: Number(sortOrder) || 0,
      };
      const result = item
        ? await updateItem(item.id, input)
        : await createItem(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="3xl"
      title={item ? `Edit ${item.name}` : "New Menu Item"}
      description="Configure menu item pricing, descriptions, dietary flags, and image showcase."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="menu-item-form"
            loading={pending}
            disabled={!name.trim() || !nameAm.trim() || !description.trim()}
          >
            {item ? "Save Changes" : "Create Item"}
          </Button>
        </>
      }
    >
      <form id="menu-item-form" onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
          {/* Left Column: General Info, Pricing, Description */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="name"
                label="Item Name"
                placeholder="e.g. Doro Wot"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                required
              />
              <Input
                name="nameAm"
                label="Amharic Name"
                placeholder="e.g. ዶሮ ወጥ"
                value={nameAm}
                onChange={(event) => setNameAm(event.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="slug"
                label="Slug"
                hint="Lowercase kebab-case."
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                disabled={Boolean(item)}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
              <Select
                name="categoryId"
                label="Category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="price"
                label="Price (ETB)"
                type="number"
                min={0.01}
                step="0.01"
                placeholder="e.g. 780"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
              <Input
                name="sortOrder"
                label="Sort Order"
                type="number"
                min={0}
                max={999}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </div>

            <Textarea
              name="description"
              label="Description"
              rows={3}
              placeholder="Describe the dish, ingredients, and presentation…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
            <Textarea
              name="descriptionAm"
              label="Amharic Description (optional)"
              rows={2}
              placeholder="የምግብ ዝርዝር መግለጫ…"
              value={descriptionAm}
              onChange={(event) => setDescriptionAm(event.target.value)}
            />
          </div>

          {/* Right Column: Media, Status, Dietary & Badges */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-stone-50/50 p-4">
              <ImageUpload value={image} onChange={setImage} />
            </div>

            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Availability &amp; Highlights</p>
              <div className="space-y-2">
                <Checkbox
                  name="isAvailable"
                  label="Available for guest ordering"
                  checked={isAvailable}
                  onChange={(event) => setIsAvailable(event.target.checked)}
                />
                <Checkbox
                  name="isFeatured"
                  label="Featured (Chef's Favorites Spotlight)"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Dietary Specifications</p>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY_TAGS.map((tag) => (
                  <Checkbox
                    key={tag}
                    name={`dietary-${tag}`}
                    label={DIETARY_LABELS[tag]}
                    checked={dietaryTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Badges</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {MENU_ITEM_BADGES.map((badge) => (
                  <Checkbox
                    key={badge}
                    name={`badge-${badge}`}
                    label={BADGE_LABELS[badge]}
                    checked={badges.includes(badge)}
                    onChange={() => toggleBadge(badge)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
