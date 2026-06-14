/** Store / site name used in page titles and Open Graph siteName. */
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Ecommerce Store';

/** Public site URL for absolute Open Graph image URLs. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';

export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'youtube' | 'linkedin';

export type SocialLink = {
  platform: SocialPlatform;
  href: string;
  label: string;
};

const socialEnv = (key: string) => process.env[key]?.trim() || '';

/** Social profiles shown in the footer. Omit env vars to hide a platform. */
export const SOCIAL_LINKS = (
  [
    { platform: 'facebook' as const, href: socialEnv('NEXT_PUBLIC_SOCIAL_FACEBOOK'), label: 'Facebook' },
    { platform: 'instagram' as const, href: socialEnv('NEXT_PUBLIC_SOCIAL_INSTAGRAM'), label: 'Instagram' },
    { platform: 'x' as const, href: socialEnv('NEXT_PUBLIC_SOCIAL_X'), label: 'X' },
    { platform: 'youtube' as const, href: socialEnv('NEXT_PUBLIC_SOCIAL_YOUTUBE'), label: 'YouTube' },
    { platform: 'linkedin' as const, href: socialEnv('NEXT_PUBLIC_SOCIAL_LINKEDIN'), label: 'LinkedIn' },
  ] satisfies Array<{ platform: SocialPlatform; href: string; label: string }>
).filter((item) => item.href.length > 0);

