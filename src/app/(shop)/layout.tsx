import { ShopFooter } from '@/components/shop/footer';
import { ShopHeader } from '@/components/shop/header';
import { MobileBottomNav } from '@/components/shop/mobile-bottom-nav';
import { AuthInitializer } from '@/components/auth-initializer';
import { QueryProvider } from '@/providers/query-provider';
import { getBranding } from '@/lib/server-api';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding();

  return (
    <QueryProvider>
      <AuthInitializer />
      <ShopHeader initialBranding={branding} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:py-10 md:pb-10">
        {children}
      </main>
      <ShopFooter branding={branding} />
      <MobileBottomNav />
    </QueryProvider>
  );
}
