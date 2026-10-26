import type { Metadata } from "next";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply when you use RentGH to find, list, rent, or buy property in Ghana.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="RentGH terms"
      title="Terms of Use"
      intro="These terms explain the rules for using RentGH. By browsing the site, creating an account, listing a property, or sending an inquiry, you agree to these terms."
    >
      <LegalSection title="1. What RentGH is">
        <p>
          RentGH is an online marketplace that helps property seekers discover
          listings published by agents and landlords in Ghana. RentGH is not a
          party to a tenancy, sale, viewing, negotiation, or payment arranged
          between users unless a separate written agreement clearly says
          otherwise.
        </p>
        <p>
          Users must make their own checks before renting, buying, paying for,
          or moving into a property.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts and roles">
        <LegalList
          items={[
            "You must provide accurate account information and keep your login details private.",
            "Tenants may browse, save properties, and send inquiries. Agents and landlords may manage listings that they own or are authorised to market.",
            "Administrator accounts are appointed by RentGH and cannot be selected during public registration.",
            "You are responsible for activity carried out through your account. Tell RentGH promptly if you believe the account has been accessed without permission.",
            "RentGH may suspend or ban an account that breaks these terms, creates a safety risk, or is used for fraud or abuse.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Listings and moderation">
        <p>
          Agents and landlords are responsible for the accuracy of their
          listings, including the price, location, description, photos,
          availability, and their authority to rent or sell the property.
          Listings are reviewed before publication and may be reviewed again
          after material changes.
        </p>
        <p>
          RentGH may approve, reject, edit for safety or clarity where
          appropriate, remove, or mark a listing unavailable. Approval means
          the submitted listing passed platform review. It is not a guarantee
          of ownership, land title, condition, legality, or availability.
        </p>
      </LegalSection>

      <LegalSection title="4. Inquiries, viewings, and offline agreements">
        <p>
          Inquiries help users contact the listing owner through RentGH. Any
          viewing, tenancy, purchase, reservation, fee, deposit, rent, or other
          payment is arranged directly between the users involved. RentGH does
          not currently collect rent, deposits, or purchase payments through
          the platform.
        </p>
        <p>
          Inspect the property and use a written agreement before paying. Keep
          receipts and records of important promises, fees, and payments.
        </p>
      </LegalSection>

      <LegalSection title="5. Prohibited use">
        <LegalList
          items={[
            "Posting a false, misleading, duplicate, unavailable, or unauthorised listing.",
            "Impersonating another person, agent, landlord, buyer, tenant, or RentGH administrator.",
            "Using RentGH for fraud, spam, harassment, unlawful discrimination, or another unlawful purpose.",
            "Uploading content that you do not have the right to use, including stolen photographs or documents.",
            "Scraping the site at scale, bypassing security controls, interfering with the service, or uploading malicious code.",
            "Asking users to pay for a property that cannot be viewed or verified.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Content and intellectual property">
        <p>
          You keep ownership of content that you submit, but you give RentGH a
          non-exclusive permission to host, display, reproduce, and promote
          that content as needed to operate and improve the marketplace. Do
          not submit content unless you have the necessary rights.
        </p>
        <p>
          The RentGH name, branding, site design, and original site content
          belong to RentGH or its licensors and may not be used in a way that
          suggests endorsement without permission.
        </p>
      </LegalSection>

      <LegalSection title="7. Maps, links, and third-party services">
        <p>
          Map pins and third-party map tiles are provided for general location
          guidance and may be approximate. Links or services operated by other
          organisations are subject to their own terms and privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="8. Availability and liability">
        <p>
          RentGH works to keep the marketplace available and secure, but the
          service may change or be interrupted for maintenance, security, or
          technical reasons. To the maximum extent permitted by law, RentGH is
          not responsible for false statements by users, failed viewings or
          transactions, property condition, or losses arising from offline
          dealings between users.
        </p>
        <p>
          Nothing in these terms limits liability that cannot lawfully be
          limited.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes and termination">
        <p>
          RentGH may update these terms or parts of the service. Material
          changes will be reflected on this page with a new update date.
          Continued use after an update takes effect means the updated terms
          apply to that later use.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law">
        <p>
          These terms are governed by the laws of Ghana. Users should first
          try to resolve a platform concern with RentGH through the contact
          details below. Property and tenancy disputes may also require advice
          from an appropriate professional or public authority.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
