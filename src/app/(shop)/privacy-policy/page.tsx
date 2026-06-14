import { StaticPageLayout, StaticSection } from '@/components/shop/static-page-layout';
import { SITE_NAME } from '@/lib/site-config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `Read how ${SITE_NAME} collects, uses, and protects your personal information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      description="This policy explains what information we collect, how we use it, and the choices you have."
    >
      <StaticSection title="Information we collect">
        <p>We may collect the following information when you use our store:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details such as name, email, phone number, and password</li>
          <li>Order and delivery information including address and contact details</li>
          <li>Payment-related data required to complete transactions</li>
          <li>Technical data such as device type, browser, and usage activity</li>
        </ul>
      </StaticSection>

      <StaticSection title="How we use your information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Process orders, payments, and deliveries</li>
          <li>Provide customer support and order updates</li>
          <li>Improve our website, products, and services</li>
          <li>Prevent fraud and maintain platform security</li>
          <li>Send important service-related communications</li>
        </ul>
      </StaticSection>

      <StaticSection title="Data sharing">
        <p>
          We do not sell your personal information. We may share data with trusted service
          providers who help us operate the store, such as payment processors, delivery partners,
          and hosting providers. These partners are required to handle data securely and only for
          the services they provide to us.
        </p>
      </StaticSection>

      <StaticSection title="Cookies and storage">
        <p>
          We use cookies and similar technologies to keep you signed in, remember preferences,
          and understand how the site is used. You can control cookies through your browser
          settings, though some features may not work correctly if cookies are disabled.
        </p>
      </StaticSection>

      <StaticSection title="Data security">
        <p>
          We apply reasonable technical and organizational safeguards to protect your
          information. However, no online system can be guaranteed to be completely secure.
        </p>
      </StaticSection>

      <StaticSection title="Your rights">
        <p>
          Depending on applicable law, you may request access to, correction of, or deletion of
          your personal data. To make a request, contact us using the details provided on our
          website.
        </p>
      </StaticSection>

      <StaticSection title="Updates to this policy">
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this
          page with an updated effective date. Continued use of the site after changes means you
          accept the revised policy.
        </p>
        <p className="text-sm text-zinc-500">Last updated: June 2026</p>
      </StaticSection>
    </StaticPageLayout>
  );
}
