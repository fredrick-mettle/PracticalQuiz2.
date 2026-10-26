import type { Metadata } from "next";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How RentGH collects, uses, shares, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Your privacy"
      title="Privacy Policy"
      intro="This policy explains what information RentGH processes, why it is needed, who can receive it, and the choices available to you. RentGH aims to handle personal data consistently with the Ghana Data Protection Act, 2012 (Act 843)."
    >
      <LegalSection title="1. Information RentGH collects">
        <LegalList
          items={[
            "Account information, such as your name, email address, phone number, account role, and a securely hashed password.",
            "Listing information submitted by agents and landlords, including property details, price, area, city, region, map coordinates where provided, and photographs.",
            "Inquiries, replies, saved properties, moderation decisions, and account status records.",
            "Technical and security information needed to operate the service, such as request logs, approximate network identifiers used for rate limiting, browser information, and error records processed by hosting providers.",
            "Information that you send directly to the RentGH administrator by email.",
          ]}
        />
      </LegalSection>

      <LegalSection title="2. How information is used">
        <LegalList
          items={[
            "To create and secure accounts and to provide tenant, agent, landlord, and administrator features.",
            "To publish approved listings and help users search by location, price, type, and other criteria.",
            "To deliver inquiries and replies between the participants in a conversation.",
            "To moderate listings and accounts, investigate abuse, prevent fraud, and enforce the Terms of Use.",
            "To respond to support, privacy, and safety requests.",
            "To maintain, troubleshoot, and improve the marketplace.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Information visible to other people">
        <p>
          Approved listing details are public. This includes the property
          description and photographs, approximate map location where supplied,
          the listing owner name, and a phone number that is revealed through
          the contact controls. Inquiry messages are visible to the sender,
          the property owner in that conversation, and authorised RentGH
          administrators when access is necessary for support, safety, or
          moderation.
        </p>
        <p>
          Do not place unnecessary private information in a public listing or
          an inquiry message.
        </p>
      </LegalSection>

      <LegalSection title="4. Service providers and external content">
        <p>
          RentGH uses service providers to host the application and database
          and to support core features. Current or planned providers include
          Vercel for hosting, Supabase for PostgreSQL database services,
          Cloudinary for property image uploads when configured, and Resend
          for email delivery when configured. These providers process only the
          information needed for their services and under their own security
          and contractual controls.
        </p>
        <p>
          Map tiles may load directly from OpenStreetMap tile services in your
          browser. That request can expose technical information such as an IP
          address to the tile provider, in the same way as loading another
          website resource.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <p>
          RentGH uses essential cookies needed for sign-in sessions and site
          security. The current site does not use advertising cookies. If a
          future analytics or advertising tool is added, this policy should be
          updated before or when that tool is enabled.
        </p>
      </LegalSection>

      <LegalSection title="6. Retention and security">
        <p>
          Account, listing, favorite, and inquiry records are kept while they
          are needed to operate the marketplace, resolve disputes, prevent
          abuse, or meet legal obligations. Backups and provider logs may be
          retained for limited periods under provider policies.
        </p>
        <p>
          Passwords are stored as bcrypt hashes, access is role-controlled,
          and production traffic uses HTTPS. No online system is completely
          secure, so users should choose a strong unique password and report
          suspected account misuse promptly.
        </p>
      </LegalSection>

      <LegalSection title="7. Your choices and rights">
        <p>
          You may contact RentGH to request access to, correction of, or
          deletion of your personal information, subject to identity checks
          and legal or security requirements. You may also ask questions about
          how information is used or object to a use that you believe is not
          justified.
        </p>
        <p>
          Deleting an agent or landlord account can affect listings, inquiry
          history, and related records. RentGH will explain the practical
          effect before carrying out a deletion request where possible.
        </p>
      </LegalSection>

      <LegalSection title="8. Children">
        <p>
          RentGH is intended for adults who are searching for, renting,
          buying, or listing property. It is not intended for children under
          18. Contact RentGH if you believe a child has created an account or
          submitted personal information.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to this policy">
        <p>
          RentGH may update this policy as features, providers, or legal
          requirements change. The date at the top of this page will be
          updated when a revised policy is published.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
