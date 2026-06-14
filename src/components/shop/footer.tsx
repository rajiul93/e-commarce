import Link from 'next/link';
import { SocialLinks } from '@/components/shop/social-links';
import { FooterBrand } from '@/components/shop/footer-brand';
import { FOOTER_COMPANY_LINKS, FOOTER_SHOP_LINKS } from '@/lib/shop-nav';
import { SITE_NAME, SOCIAL_LINKS } from '@/lib/site-config';
import type { BrandingSettings } from '@/types';

type ShopFooterProps = {
  branding?: BrandingSettings | null;
};

export function ShopFooter({ branding }: ShopFooterProps) {
  const siteName = branding?.siteName?.trim() || SITE_NAME;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-950 text-zinc-300 pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <FooterBrand initialBranding={branding} />
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Quality products, secure checkout, and reliable delivery — everything you need for a
              modern shopping experience.
            </p>
            <SocialLinks links={SOCIAL_LINKS} />
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Stay connected
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              {SOCIAL_LINKS.length
                ? 'Follow us on social media for new arrivals, offers, and updates.'
                : 'Add social profile URLs in your environment variables to show links here.'}
            </p>
            {SOCIAL_LINKS.length ? <SocialLinks links={SOCIAL_LINKS} className="mt-4" /> : null}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-800 pt-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {siteName}. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {FOOTER_COMPANY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-zinc-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
