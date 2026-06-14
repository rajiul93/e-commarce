'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageRef } from '@/types';

export type GalleryExistingItem = {
  id: string;
  url: string;
};

export type GalleryPendingItem = {
  localId: string;
  file: File;
  previewUrl: string;
};

export type GalleryReplacement = {
  mediaId: string;
  file: File;
  previewUrl: string;
};

function revokeBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

export function useProductGallery() {
  const [existingItems, setExistingItems] = useState<GalleryExistingItem[]>([]);
  const [pendingItems, setPendingItems] = useState<GalleryPendingItem[]>([]);
  const [replacements, setReplacements] = useState<GalleryReplacement[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const pendingRef = useRef<GalleryPendingItem[]>([]);
  const replacementsRef = useRef<GalleryReplacement[]>([]);

  pendingRef.current = pendingItems;
  replacementsRef.current = replacements;

  const setFromServer = useCallback((images?: ImageRef[] | null) => {
    setExistingItems(
      (images ?? [])
        .filter((img) => img?._id && img?.url)
        .map((img) => ({ id: img._id, url: img.url })),
    );
    setPendingItems((prev) => {
      prev.forEach((p) => revokeBlob(p.previewUrl));
      return [];
    });
    setReplacements((prev) => {
      prev.forEach((r) => revokeBlob(r.previewUrl));
      return [];
    });
    setRemovedIds(new Set());
  }, []);

  const reset = useCallback(() => {
    setExistingItems([]);
    setPendingItems((prev) => {
      prev.forEach((p) => revokeBlob(p.previewUrl));
      return [];
    });
    setReplacements((prev) => {
      prev.forEach((r) => revokeBlob(r.previewUrl));
      return [];
    });
    setRemovedIds(new Set());
  }, []);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => revokeBlob(p.previewUrl));
      replacementsRef.current.forEach((r) => revokeBlob(r.previewUrl));
    };
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newPending: GalleryPendingItem[] = Array.from(files).map((file) => ({
      localId: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingItems((prev) => [...prev, ...newPending]);
  }, []);

  const removePending = useCallback((localId: string) => {
    setPendingItems((prev) => {
      const item = prev.find((p) => p.localId === localId);
      if (item) revokeBlob(item.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }, []);

  const removeExisting = useCallback((id: string) => {
    setRemovedIds((prev) => new Set(prev).add(id));
    setReplacements((prev) => {
      const item = prev.find((r) => r.mediaId === id);
      if (item) revokeBlob(item.previewUrl);
      return prev.filter((r) => r.mediaId !== id);
    });
  }, []);

  const restoreExisting = useCallback((id: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const replaceExisting = useCallback((mediaId: string, file: File | null) => {
    setReplacements((prev) => {
      const existing = prev.find((r) => r.mediaId === mediaId);
      if (existing) revokeBlob(existing.previewUrl);

      if (!file) return prev.filter((r) => r.mediaId !== mediaId);

      return [
        ...prev.filter((r) => r.mediaId !== mediaId),
        { mediaId, file, previewUrl: URL.createObjectURL(file) },
      ];
    });
  }, []);

  const getDisplayUrl = useCallback(
    (item: GalleryExistingItem) => {
      const replacement = replacements.find((r) => r.mediaId === item.id);
      return replacement?.previewUrl ?? item.url;
    },
    [replacements],
  );

  const isExistingVisible = useCallback(
    (id: string) => !removedIds.has(id),
    [removedIds],
  );

  const hasImages =
    pendingItems.length > 0 ||
    existingItems.some((item) => !removedIds.has(item.id));

  return {
    existingItems,
    pendingItems,
    replacements,
    removedIds,
    addFiles,
    removePending,
    removeExisting,
    restoreExisting,
    replaceExisting,
    getDisplayUrl,
    isExistingVisible,
    setFromServer,
    reset,
    hasImages,
  };
}
