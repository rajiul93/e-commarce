'use client';

import { Button } from '@/components/ui/button';
import type { useProductThumbnail } from '@/hooks/use-product-thumbnail';
import { useRef } from 'react';

type Props = {
  thumbnail: ReturnType<typeof useProductThumbnail>;
  label?: string;
  description?: string;
};

export function ProductThumbnailPicker({
  thumbnail,
  label = 'Thumbnail',
  description = 'Main cover image (optional). Uploads on save.',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{label}</span>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          {thumbnail.displayUrl ? 'Change' : 'Add thumbnail'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            thumbnail.handleFileSelect(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </div>

      {thumbnail.displayUrl ? (
        <div className="group relative h-32 w-32 overflow-hidden rounded-lg border border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail.displayUrl} alt="" className="h-full w-full object-cover" />
          {thumbnail.selectedFile ? (
            <span className="absolute bottom-0 left-0 right-0 bg-amber-500/90 px-1 text-center text-[10px] text-white">
              Pending
            </span>
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              className="text-xs text-white underline"
              onClick={() => thumbnail.removeThumbnail()}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400">
          No thumbnail
        </div>
      )}
    </div>
  );
}
