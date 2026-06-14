import { StaticPageLayout, StaticSection } from '@/components/shop/static-page-layout';
import { SITE_NAME } from '@/lib/site-config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `About Us | ${SITE_NAME}`,
  description: `Learn about ${SITE_NAME}, our mission, and how we serve our customers.`,
};

export default function AboutUsPage() {
  return (
    <StaticPageLayout
      title="About Us"
      description={`Welcome to ${SITE_NAME}. We are committed to bringing you quality products, reliable service, and a smooth shopping experience.`}
    >
      <StaticSection title="Who we are">
        <p>
          {SITE_NAME} is an online store built to make shopping simple, secure, and enjoyable. From
          curated product collections to fast checkout, we focus on giving customers a modern
          ecommerce experience they can trust.
        </p>
      </StaticSection>

      <StaticSection title="Our mission">
        <p>
          Our mission is to connect people with products they love while maintaining transparency,
          fair pricing, and responsive customer support. We continuously improve our catalog,
          delivery process, and platform so every order feels effortless.
        </p>
      </StaticSection>

      <StaticSection title="What we offer">
        <ul className="list-disc space-y-2 pl-5">
          <li>A wide range of quality products across multiple categories</li>
          <li>Secure checkout for logged-in and guest customers</li>
          <li>Order tracking and account management</li>
          <li>Dedicated support for questions, returns, and order issues</li>
        </ul>
      </StaticSection>

      <StaticSection title="Customer commitment">
        <p>
          Your trust matters to us. We work hard to protect your data, communicate clearly about
          orders, and resolve issues quickly. If you have feedback or need help, our team is here
          for you.
        </p>
      </StaticSection>
    </StaticPageLayout>
  );
}
