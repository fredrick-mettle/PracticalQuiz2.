import type { Metadata } from "next";
import {
  LegalList,
  LegalPage,
  LegalSection,
  SupportEmailLink,
  SupportPhoneLink,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Safety Tips",
  description: "Practical checks to avoid rental and property scams in Ghana when using RentGH.",
};

export default function SafetyPage() {
  return (
    <LegalPage
      eyebrow="Stay safe on RentGH"
      title="Safety Tips for Renting and Buying"
      intro="RentGH reviews listings before publication, but marketplace review cannot replace your own inspection and documents. Use the checks below before you pay money or sign an agreement."
    >
      <LegalSection title="Before you pay anything">
        <LegalList
          items={[
            "Inspect the property in person, or ask a trusted representative to inspect it and report directly to you.",
            "Confirm the identity of the agent or landlord and ask what authority they have to rent or sell the property.",
            "Check that the rooms, condition, water supply, electricity arrangements, access road, and neighbourhood match the listing.",
            "Ask for every cost in writing, including rent or price, agent fees, service charges, deposits, and payment schedule.",
            "Use a written tenancy or sale agreement. Read it fully and keep a signed copy.",
            "Pay through a traceable method where possible and obtain a receipt that identifies the payer, receiver, property, amount, and purpose.",
            "Take dated photographs or an inventory at handover, especially for furnished property and existing damage.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Warning signs of a scam">
        <LegalList
          items={[
            "The price is unusually low and the person pressures you to pay immediately to reserve the property.",
            "The person refuses a physical viewing or keeps changing the viewing location and story.",
            "You are asked to send mobile money before viewing, signing, or verifying authority.",
            "The name on the payment account does not match the agent, landlord, or business without a credible explanation.",
            "Photographs, location details, or documents look copied or inconsistent with the conversation.",
            "The person discourages questions, written agreements, receipts, or independent advice.",
          ]}
        />
        <p>
          Stop and verify separately if any of these signs appear. A genuine
          opportunity should withstand basic checks.
        </p>
      </LegalSection>

      <LegalSection title="Meeting safely">
        <LegalList
          items={[
            "Arrange viewings during the day where possible and tell a friend or relative where you are going.",
            "Bring a companion, especially for a first meeting or an unfamiliar area.",
            "Meet at the property or another safe public place. Confirm that the person can access the property lawfully.",
            "Do not carry large amounts of cash to a viewing.",
            "Share copies of identity documents only when there is a clear and legitimate need, and mark copies with the purpose where appropriate.",
          ]}
        />
        <p>
          If you face an immediate threat, leave the area and contact the Ghana
          Police Service or local emergency services.
        </p>
      </LegalSection>

      <LegalSection title="Extra checks for renting">
        <LegalList
          items={[
            "Confirm the rent amount, payment period, start date, renewal terms, notice terms, and who pays for repairs and utilities.",
            "Check the ECG meter arrangement, water storage or borehole, waste arrangements, parking, and any estate or facility rules.",
            "Ask whether any amount described as a deposit is refundable and record the conditions in the agreement.",
            "Record meter readings and property condition on the moving-in date.",
          ]}
        />
        <p>
          For tenancy guidance or disputes, consider contacting the Rent
          Control Department or a qualified legal professional in Ghana.
        </p>
      </LegalSection>

      <LegalSection title="Extra checks for buying property or land">
        <LegalList
          items={[
            "Use an independent lawyer and, where appropriate, a licensed surveyor before paying.",
            "Conduct the relevant searches and document checks, which may include enquiries at the Lands Commission.",
            "Verify title or ownership documents, indenture, site plan, boundaries, and the authority of every person or family, stool, company, or institution purporting to sell.",
            "Physically inspect the land or building and confirm boundaries, access, permits, and any occupants or disputes.",
            "Do not rely only on online photographs or an approximate map pin for a purchase decision.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Responsibilities for agents and landlords">
        <LegalList
          items={[
            "List only property that you own or are authorised to market.",
            "Keep price and availability current and remove or update a listing when circumstances change.",
            "Disclose your fees and payment terms early and clearly.",
            "Use accurate photographs and descriptions, keep records of agreements and receipts, and meet prospective clients safely.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Report a suspicious listing or user">
        <p>
          Call <SupportPhoneLink /> or email <SupportEmailLink /> with the
          listing link, the account or phone number involved, screenshots,
          dates, and payment references if money was sent. Do not send your
          RentGH password.
        </p>
        <p>
          If money has already been sent, contact your bank or mobile money
          provider immediately to ask what recovery steps may be possible, and
          report suspected fraud to the Ghana Police Service.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
