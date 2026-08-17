"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/(admin)/admin/(protected)/menu/actions";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  nameAm: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
}

/** Slugify for the auto-generated slug field (mirrors the seed helper). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  function openCreate() {
    setEditing(null);
    setName("");
    setNameAm("");
    setSlug("");
    setSortOrder("0");
    setIsActive(true);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(category: CategoryRow) {
    setEditing(category);
    setName(category.name);
    setNameAm(category.nameAm);
    setSlug(category.slug);
    setSortOrder(String(category.sortOrder));
    setIsActive(category.isActive);
    setError(null);
    setFormOpen(true);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!editing) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = {
        name: name.trim(),
        nameAm: nameAm.trim(),
        slug: slug.trim(),
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };
      const result = editing
        ? await updateCategory(editing.id, input)
        : await createCategory(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFormOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(deleting.id);
      if (result.error) {
        setError(result.error);
        setDeleting(null);
        return;
      }
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Categories</h2>
          <p className="mt-0.5 text-sm text-stone-500">
            Sections of the public menu.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus aria-hidden className="h-4 w-4" />
          New
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {categories.length === 0 ? (
          <p className="rounded-md bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            No categories yet. Create one to start building the menu.
          </p>
        ) : (
          categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-md border border-stone-200 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {category.name}
                  </p>
                  <StatusBadge value={category.isActive ? "ACTIVE" : "INACTIVE"} />
                </div>
                <p className="mt-0.5 truncate text-xs text-stone-500">
                  <span lang="am">{category.nameAm}</span> · {category.itemCount}{" "}
                  {category.itemCount === 1 ? "item" : "items"} · sort {category.sortOrder}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(category)}
                  aria-label={`Edit ${category.name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-foreground"
                >
                  <Pencil aria-hidden className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(category)}
                  disabled={category.itemCount > 0}
                  title={
                    category.itemCount > 0
                      ? "Move or delete its items first"
                      : `Delete ${category.name}`
                  }
                  aria-label={`Delete ${category.name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Create / edit dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        size="2xl"
        title={editing ? `Edit ${editing.name}` : "New Category"}
        description="Categories appear in the public menu navigation, sorted by order."
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="category-form"
              loading={pending}
              disabled={!name.trim() || !nameAm.trim()}
            >
              {editing ? "Save Changes" : "Create Category"}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              name="name"
              label="Category Name"
              placeholder="e.g. Traditional Classics"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
            />
            <Input
              name="nameAm"
              label="Amharic Name"
              placeholder="e.g. ባህላዊ ምግቦች"
              value={nameAm}
              onChange={(event) => setNameAm(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
            <div className="sm:col-span-2">
              <Input
                name="slug"
                label="Slug"
                hint="Stable public reference (lowercase kebab-case)."
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                disabled={Boolean(editing)}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
            </div>
            <div>
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
          </div>

          <div className="rounded-lg border border-border bg-stone-50/60 p-3.5">
            <Checkbox
              name="isActive"
              label="Visible on the public menu catalog"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </p>
          ) : null}
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? "category"}?`}
        description="This category will be removed from the menu. This action cannot be undone."
        confirmLabel="Delete category"
        destructive
        loading={pending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
