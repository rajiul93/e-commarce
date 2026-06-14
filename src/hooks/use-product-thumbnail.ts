'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ImageRef } from '@/types';

function revokeBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** Single optional thumbnail with local preview until save. */
export function useProductThumbnail() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const setExisting = useCallback((image?: ImageRef | null) => {
    setExistingImageId(image?._id ?? null);
    setExistingImageUrl(image?.url ?? null);
    setRemoved(false);
    if (!selectedFile) {
      setPreviewUrl(image?.url ?? null);
    }
  }, [selectedFile]);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (previewUrl?.startsWith('blob:')) revokeBlob(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(file ? URL.createObjectURL(file) : existingImageUrl);
      setRemoved(false);
    },
    [existingImageUrl, previewUrl],
  );

  const removeThumbnail = useCallback(() => {
    if (previewUrl?.startsWith('blob:')) revokeBlob(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoved(true);
  }, [previewUrl]);

  const reset = useCallback(() => {
    if (previewUrl?.startsWith('blob:')) revokeBlob(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingImageId(null);
    setExistingImageUrl(null);
    setRemoved(false);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) revokeBlob(previewUrl);
    };
  }, [previewUrl]);

  const displayUrl = removed ? null : previewUrl ?? existingImageUrl;

  return {
    selectedFile,
    existingImageId,
    existingImageUrl,
    removed,
    displayUrl,
    handleFileSelect,
    removeThumbnail,
    setExisting,
    reset,
  };
}
