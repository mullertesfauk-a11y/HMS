"use client";

import {
  coreFeatures,
  createTableHook,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * Shared TanStack Table v9 setup for admin tables.
 *
 * Features are composed once (statically) and bound into a `useAppTable` hook
 * plus a `createAppColumnHelper` with TData-first typing. Tables are
 * server-driven: sorting/pagination live in the URL, TanStack provides the
 * column/header/cell structure.
 */
export const tableFeaturesConfig = tableFeatures({
  coreFeatures,
  rowSortingFeature,
});

export const { useAppTable, createAppColumnHelper } = createTableHook({
  features: tableFeaturesConfig,
});
