'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { uploadMedia } from '@/lib/media-api';
import { useAuthStore } from '@/stores/auth-store';
import type { BrandingSettings } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export function AdminBrandingSettings() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [siteName, setSiteName] = useState('');
  const [logoId, setLogoId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const branding = useQuery({
    queryKey: ['admin', 'settings', 'branding'],
    queryFn: () => apiFetch<BrandingSettings>('/api/v1/settings/branding', { token }),
    enabled: !!token,
  });

  useEffect(() => {
    if (!branding.data) return;
    setSiteName(branding.data.siteName);
    setLogoId(branding.data.logo?._id ?? null);
    setLogoUrl(branding.data.logo?.url ?? null);
  }, [branding.data]);

  const save = useMutation({
    mutationFn: (payload: { siteName: string; logoImageId: string | null }) =>
      apiFetch<BrandingSettings>('/api/v1/settings/branding', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          siteName: payload.siteName.trim(),
          logoImageId: payload.logoImageId,
        }),
      }),
    onSuccess: (data) => {
      setMessage('Logo settings saved');
      setSiteName(data.siteName);
      setLogoId(data.logo?._id ?? null);
      setLogoUrl(data.logo?.url ?? null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'branding'] });
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  function persistBranding(nextSiteName: string, nextLogoId: string | null) {
    if (!nextSiteName.trim()) {
      setMessage('Site name is required');
      return;
    }
    setMessage('');
    save.mutate({ siteName: nextSiteName, logoImageId: nextLogoId });
  }

  async function handleLogoUpload(file: File) {
    if (!token) return;
    setUploading(true);
    setMessage('');
    try {
      const uploaded = await uploadMedia(file, token, {
        alt: siteName.trim() || 'Store logo',
        useCase: 'LOGO',
      });
      setLogoId(uploaded._id);
      setLogoUrl(uploaded.url);
      persistBranding(siteName, uploaded._id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        persistBranding(siteName, logoId);
      }}
      className="space-y-4 rounded-xl border border-zinc-200 p-4"
    >
      <h2 className="font-medium">Logo settings</h2>
      <p className="text-sm text-zinc-500">
        Upload your store logo for the navigation bar and footer. Without a logo, the site name is
        shown as text.
      </p>

      {branding.isLoading ? <p className="text-sm text-zinc-500">Loading…</p> : null}
      {branding.isError ? (
        <p className="text-sm text-red-600">
          Could not load logo settings. Restart the backend server and try again.
        </p>
      ) : null}

      <Input
        label="Site name"
        value={siteName}
        onChange={(e) => setSiteName(e.target.value)}
        placeholder="Shop"
        required
      />

      <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <div>
          <p className="text-sm font-medium">Store logo</p>
          <p className="text-xs text-zinc-500">
            Recommended: PNG or SVG with transparent background, at least 200px wide.
          </p>
        </div>

        {logoUrl ? (
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-zinc-50 p-3">
            <div className="relative h-12 w-40 shrink-0">
              <Image
                src={logoUrl}
                alt={siteName || 'Store logo'}
                fill
                className="object-contain object-left"
                sizes="160px"
                unoptimized
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={uploading || save.isPending}
                onClick={() => fileRef.current?.click()}
              >
                Replace logo
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={uploading || save.isPending}
                onClick={() => {
                  setLogoId(null);
                  setLogoUrl(null);
                  persistBranding(siteName, null);
                }}
              >
                Remove logo
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
            <p className="text-sm text-zinc-500">No logo uploaded yet</p>
            <Button
              type="button"
              className="mt-3"
              disabled={uploading || save.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Upload logo'}
            </Button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleLogoUpload(file);
            e.target.value = '';
          }}
        />
      </div>

      {message ? (
        <p
          className={`text-sm ${
            save.isError || branding.isError ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={save.isPending || branding.isLoading || uploading}>
        {save.isPending ? 'Saving…' : 'Save site name'}
      </Button>
    </form>
  );
}
