import type { FaqGroup, FaqItem } from "./types";
import { CARE_PACKAGE, SUPPORT_COPY } from "./content";

export const faqGroups: FaqGroup[] = [
  {
    id: "placement",
    title: "Placement and meetings",
    items: [
      {
        id: "agree-hold",
        question: "What happens when we agree on a puppy?",
        answer: [
          "After we agree on the puppy and next steps, we can place a temporary hold until a deposit deadline agreed together. We provide written terms before you pay. When the deposit is received, the puppy becomes reserved for you. If it is not received by the agreed deadline, the puppy becomes available again. The puppy is marked sold when the purchase is completed.",
        ],
      },
      {
        id: "meetings",
        question: "Can I arrange a video call or an in-person appointment?",
        answer: [
          "Yes. We offer both by appointment after a reservation deposit has been paid. We will agree on the arrangements with you directly. Reservation deposits are refundable if you decide not to proceed.",
        ],
      },
      {
        id: "deposit-refund",
        question: "What if I decide not to go ahead after paying a deposit?",
        answer: [
          "We return the reservation deposit if you decide not to proceed, including after a video call or appointment. We also return it if we cannot complete the placement. The written terms provided before payment explain the arrangement.",
        ],
      },
      {
        id: "handover",
        question: "How can my puppy come home?",
        answer: [
          "We can discuss local pickup, an airport meeting, or personal delivery by one of us. We agree on what works for your situation, including the location, timing, and any delivery costs, before finalizing the arrangements.",
        ],
      },
    ],
  },
  {
    id: "records-support",
    title: "Records and support",
    items: [
      {
        id: "records",
        question: "What records come with a puppy?",
        answer: [
          CARE_PACKAGE.vaccinesDeworming,
          CARE_PACKAGE.pedigrees,
          CARE_PACKAGE.akcOptional,
        ],
      },
      {
        id: "dna-traits",
        question: "Are the puppies' coat and carrier descriptions individual DNA results?",
        answer: [
          "No. We use both parents' DNA results and each puppy's appearance to assess coat traits. Our puppies have not been individually DNA tested, so genetic and carrier descriptions are breeder assessments rather than individual test results.",
        ],
      },
      {
        id: "after-home",
        question: "Can I contact you after my puppy comes home?",
        answer: [SUPPORT_COPY.personal],
      },
      {
        id: "rehoming",
        question: "What if my circumstances change and I cannot keep my dog?",
        answer: [
          "Please contact us so we can discuss the situation. Depending on the circumstances, we may be able to help find a new home or consider welcoming the dog back.",
        ],
      },
    ],
  },
];

export function getAllFaqs(): FaqItem[] {
  return faqGroups.flatMap((group) => group.items);
}

/** Homepage no longer mirrors the FAQ accordion; keep helper for tests/legacy callers. */
export function getFeaturedFaqs(limit = 5): FaqItem[] {
  return getAllFaqs().slice(0, limit);
}
