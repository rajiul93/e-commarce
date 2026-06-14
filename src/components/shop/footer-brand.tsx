'use client';

import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { SITE_NAME } from '@/lib/site-config';
import type { BrandingSettings } from '@/types';
import { useQuery } from '@tanstack/react-query';

type FooterBrandProps = {
  initialBranding?: BrandingSettings | null;
};

export function FooterBrand({ initialBranding }: FooterBrandProps) {
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: () => apiFetch<BrandingSettings>('/api/v1/settings/branding'),
    initialData: initialBranding ?? undefined,
    staleTime: 60_000,
  });

  const siteName = branding?.siteName?.trim() || SITE_NAME;
  const logo = branding?.logo;

  return (
    <Link href="/" className="inline-flex items-center" aria-label={siteName}>
      {logo?.url ? (
        <span className="inline-flex rounded-lg bg-white px-3 py-2">
          <span className="relative block h-9 w-36">
            <Image
              src={logo.url}
              alt={logo.alt || siteName}
              fill
              className="object-contain object-left"
              sizes="144px"
              unoptimized
            />
          </span>
        </span>
      ) : (
        <span className="text-xl font-bold tracking-tight text-white">{siteName}</span>
      )}
    </Link>
  );
}
