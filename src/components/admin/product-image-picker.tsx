'use client';

import { Button } from '@/components/ui/button';
import { useProductGallery } from '@/hooks/use-product-gallery';
import { useRef } from 'react';

type Props = {
  gallery: ReturnType<typeof useProductGallery>;
  label?: string;
};

export function ProductImagePicker({ gallery, label = 'Gallery images' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          Add images
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) gallery.addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <p className="text-xs text-zinc-500">
        Extra photos (optional, 0 or more). Upload when you save the product.
      </p>

      <div className="flex flex-wrap gap-3">
        {gallery.existingItems.map((item) => {
          if (!gallery.isExistingVisible(item.id)) {
            return (
              <div
                key={item.id}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500"
              >
                Removed
                <button
                  type="button"
                  className="mt-1 text-zinc-700 underline"
                  onClick={() => gallery.restoreExisting(item.id)}
                >
                  Undo
                </button>
              </div>
            );
          }

          return (
            <div key={item.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery.getDisplayUrl(item)}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition group-hover:opacity-100">
                <label className="cursor-pointer text-xs text-white underline">
                  Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      gallery.replaceExisting(item.id, file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-white underline"
                  onClick={() => gallery.removeExisting(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        {gallery.pendingItems.map((item) => (
          <div key={item.localId} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                className="text-xs text-white underline"
                onClick={() => gallery.removePending(item.localId)}
              >
                Remove
              </button>
            </div>
            <span className="absolute bottom-0 left-0 right-0 bg-amber-500/90 px-1 text-center text-[10px] text-white">
              Pending
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
