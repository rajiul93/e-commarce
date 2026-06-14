'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { uploadMedia } from '@/lib/media-api';
import { useAuthStore } from '@/stores/auth-store';
import type { HomeHeroSettings, HeroStyle, Product } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

type SlideDraft = { imageId: string; imageUrl: string; productId: string };
type SideDraft = { imageId: string; imageUrl: string; productId: string };

const STYLE_OPTIONS: { value: HeroStyle; label: string; description: string }[] = [
  {
    value: 'split_one',
    label: 'Style 1 — Slider + 1 product',
    description: 'Left slider, right one image linked to a product.',
  },
  {
    value: 'split_two',
    label: 'Style 2 — Slider + 2 products',
    description: 'Left slider, right two stacked product images with links.',
  },
  {
    value: 'slider_only',
    label: 'Style 3 — Slider only',
    description: 'Full-width slider. Each slide can link to a product.',
  },
];

function emptySideSlots(style: HeroStyle): SideDraft[] {
  if (style === 'split_one') return [{ imageId: '', imageUrl: '', productId: '' }];
  if (style === 'split_two') {
    return [
      { imageId: '', imageUrl: '', productId: '' },
      { imageId: '', imageUrl: '', productId: '' },
    ];
  }
  return [];
}

export function AdminHomeHeroSettings() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [style, setStyle] = useState<HeroStyle>('slider_only');
  const [isActive, setIsActive] = useState(true);
  const [slides, setSlides] = useState<SlideDraft[]>([]);
  const [sideItems, setSideItems] = useState<SideDraft[]>([]);
  const [message, setMessage] = useState('');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const hero = useQuery({
    queryKey: ['admin', 'settings', 'home-hero'],
    queryFn: () => apiFetch<HomeHeroSettings>('/api/v1/settings/home-hero', { token }),
    enabled: !!token,
  });

  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => apiFetch<Product[]>('/api/v1/product/admin/all', { token }),
    enabled: !!token,
  });

  useEffect(() => {
    if (!hero.data) return;
    setStyle(hero.data.style);
    setIsActive(hero.data.isActive);
    setSlides(
      hero.data.slides.map((s) => ({
        imageId: s.image?._id ?? '',
        imageUrl: s.image?.url ?? '',
        productId: s.product?._id ?? '',
      })),
    );
    const sides = hero.data.sideItems.map((item) => ({
      imageId: item.image?._id ?? '',
      imageUrl: item.image?.url ?? '',
      productId: item.product?._id ?? '',
    }));
    if (sides.length) {
      setSideItems(sides);
    } else {
      setSideItems(emptySideSlots(hero.data.style));
    }
  }, [hero.data]);

  useEffect(() => {
    if (style === 'slider_only') {
      setSideItems([]);
    } else if (sideItems.length === 0 || (style === 'split_one' && sideItems.length > 1)) {
      setSideItems(emptySideSlots(style));
    } else if (style === 'split_two' && sideItems.length < 2) {
      setSideItems(emptySideSlots(style));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch<HomeHeroSettings>('/api/v1/settings/home-hero', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          style,
          isActive,
          slides: slides
            .filter((s) => s.imageId)
            .map((s) => ({
              image: s.imageId,
              productId: s.productId || null,
            })),
          sideItems: sideItems
            .filter((s) => s.imageId && s.productId)
            .map((s) => ({
              image: s.imageId,
              productId: s.productId,
            })),
        }),
      }),
    onSuccess: () => {
      setMessage('Home hero saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'home-hero'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  async function uploadForSlot(
    file: File,
    kind: 'slide' | 'side',
    index: number,
  ) {
    if (!token) return;
    const key = `${kind}-${index}`;
    setUploadingKey(key);
    try {
      const uploaded = await uploadMedia(file, token, {
        alt: kind === 'slide' ? 'Hero slide' : 'Hero side product',
        useCase: 'BANNER',
      });
      if (kind === 'slide') {
        setSlides((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], imageId: uploaded._id, imageUrl: uploaded.url };
          return next;
        });
      } else {
        setSideItems((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], imageId: uploaded._id, imageUrl: uploaded.url };
          return next;
        });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage('');
        save.mutate();
      }}
      className="space-y-4 rounded-xl border border-zinc-200 p-4"
    >
      <h2 className="font-medium">Home hero</h2>
      <p className="text-sm text-zinc-500">Control the hero section layout and content on the home page.</p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Show custom hero on home page
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Layout style</span>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as HeroStyle)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          {STYLE_OPTIONS.find((o) => o.value === style)?.description}
        </p>
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Slider images (left / full width)</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSlides([...slides, { imageId: '', imageUrl: '', productId: '' }])}
          >
            Add slide
          </Button>
        </div>
        {slides.length === 0 ? (
          <p className="text-sm text-zinc-500">No slides yet. Add at least one image.</p>
        ) : (
          slides.map((slide, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-zinc-200 p-3">
              <div className="flex flex-wrap items-center gap-3">
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.imageUrl} alt="" className="h-20 w-32 rounded object-cover" />
                ) : (
                  <div className="flex h-20 w-32 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
                    No image
                  </div>
                )}
                <label className="cursor-pointer text-sm text-zinc-700 underline">
                  {uploadingKey === `slide-${index}` ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadForSlot(file, 'slide', index);
                      e.target.value = '';
                    }}
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSlides(slides.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Link to product (optional)</span>
                <select
                  value={slide.productId}
                  onChange={(e) => {
                    const next = [...slides];
                    next[index] = { ...next[index], productId: e.target.value };
                    setSlides(next);
                  }}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="">No product link</option>
                  {(products.data ?? []).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))
        )}
      </div>

      {style !== 'slider_only' ? (
        <div className="space-y-3">
          <span className="text-sm font-medium">
            Side product images (right) — {style === 'split_one' ? '1 slot' : '2 slots'}
          </span>
          {sideItems.map((item, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-zinc-200 p-3">
              <div className="flex flex-wrap items-center gap-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-20 w-32 rounded object-cover" />
                ) : (
                  <div className="flex h-20 w-32 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
                    No image
                  </div>
                )}
                <label className="cursor-pointer text-sm text-zinc-700 underline">
                  {uploadingKey === `side-${index}` ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadForSlot(file, 'side', index);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Product link (required)</span>
                <select
                  value={item.productId}
                  onChange={(e) => {
                    const next = [...sideItems];
                    next[index] = { ...next[index], productId: e.target.value };
                    setSideItems(next);
                  }}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select product</option>
                  {(products.data ?? []).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      ) : null}

      {message ? (
        <p className={`text-sm ${save.isError ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
      ) : null}

      <Button type="submit" disabled={save.isPending || hero.isLoading}>
        {save.isPending ? 'Saving…' : 'Save home hero'}
      </Button>
    </form>
  );
}
