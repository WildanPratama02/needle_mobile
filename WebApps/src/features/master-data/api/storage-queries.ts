import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createStorageMapping, fetchStorageMappings, updateStorageMapping } from "./storage-data-source";
import type { StorageMappingListFilters, UpdateStorageMappingInput } from "./storage-types";

export const storageMappingKeys = {
  all: ["storage-mappings"] as const,
  list: (filters: StorageMappingListFilters) => [...storageMappingKeys.all, "list", filters] as const,
};

export function useStorageMappings(filters: StorageMappingListFilters, enabled = true) {
  return useQuery({
    queryKey: storageMappingKeys.list(filters),
    queryFn: () => fetchStorageMappings(filters),
    retry: false,
    enabled,
  });
}

/** Invalidates the whole `storage-mappings` key space — one list, refetched after every write, same convention as Inventory's mutations. */
export function useCreateStorageMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStorageMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageMappingKeys.all });
    },
  });
}

export function useUpdateStorageMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStorageMappingInput }) =>
      updateStorageMapping(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageMappingKeys.all });
    },
  });
}
