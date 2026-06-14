import { StaticPageLayout, StaticSection } from '@/components/shop/static-page-layout';
import { SITE_NAME } from '@/lib/site-config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Terms & Conditions | ${SITE_NAME}`,
  description: `Terms and conditions for using ${SITE_NAME} and placing orders.`,
};

export default function TermsAndConditionsPage() {
  return (
    <StaticPageLayout
      title="Terms & Conditions"
      description="Please read these terms carefully before using our website or placing an order."
    >
      <StaticSection title="Acceptance of terms">
        <p>
          By accessing {SITE_NAME} or placing an order, you agree to these Terms & Conditions. If
          you do not agree, please do not use our services.
        </p>
      </StaticSection>

      <StaticSection title="Account and orders">
        <ul className="list-disc space-y-2 pl-5">
          <li>You are responsible for keeping your account credentials secure.</li>
          <li>Order details must be accurate, including shipping address and contact information.</li>
          <li>We reserve the right to cancel orders affected by pricing errors, stock issues, or suspected fraud.</li>
        </ul>
      </StaticSection>

      <StaticSection title="Pricing and payment">
        <p>
          All prices are shown in the currency displayed at checkout unless stated otherwise.
          Promotions, coupons, and discounts are subject to their specific terms. Payment must be
          completed before an order is confirmed.
        </p>
      </StaticSection>

      <StaticSection title="Shipping and delivery">
        <p>
          Delivery timelines are estimates and may vary based on location, product availability,
          and courier performance. Risk of loss passes to you upon delivery to the address provided
          at checkout.
        </p>
      </StaticSection>

      <StaticSection title="Returns and refunds">
        <p>
          Return and refund eligibility depends on product type, condition, and applicable law.
          Please contact customer support for return instructions. Approved refunds are processed
          using the original payment method where possible.
        </p>
      </StaticSection>

      <StaticSection title="Intellectual property">
        <p>
          All content on this website, including logos, text, images, and design, is owned by or
          licensed to {SITE_NAME}. You may not copy, reproduce, or distribute content without
          permission.
        </p>
      </StaticSection>

      <StaticSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {SITE_NAME} is not liable for indirect,
          incidental, or consequential damages arising from use of the website or products
          purchased through it.
        </p>
      </StaticSection>

      <StaticSection title="Changes to terms">
        <p>
          We may update these Terms & Conditions at any time. Updated terms will be published on
          this page. Your continued use of the site constitutes acceptance of the revised terms.
        </p>
        <p className="text-sm text-zinc-500">Last updated: June 2026</p>
      </StaticSection>
    </StaticPageLayout>
  );
}
