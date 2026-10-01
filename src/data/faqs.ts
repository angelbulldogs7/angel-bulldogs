import type { FaqGroup, FaqItem } from "./types";

export const faqGroups: FaqGroup[] = [
  {
    id: "location",
    title: "Location & delivery",
    items: [
      {
        id: "where",
        question: "Where is Angel Bulldogs located?",
        answer: [
          "Angel Bulldogs is based in Chicago, Illinois. We do not publish a private home address.",
          "Chicago pickup can be arranged for approved families, and we can also discuss nationwide delivery.",
        ],
        featured: true,
      },
      {
        id: "delivery",
        question: "Is nationwide delivery available?",
        answer: [
          "Yes. For approved families, Angel Bulldogs can coordinate nationwide delivery.",
          "Exact arrangements are discussed individually. We do not publish a single carrier, method, price, or timeline because those details depend on the family and the moment.",
        ],
        featured: true,
      },
    ],
  },
  {
    id: "placement",
    title: "Applying & placement",
    items: [
      {
        id: "price",
        question: "How do I learn a puppy’s price?",
        answer: [
          "Pricing is available upon inquiry. We share it during a personal conversation, once we understand the home and the puppy in question.",
          "There is no public price list and no instant checkout on this website.",
        ],
        featured: true,
      },
      {
        id: "apply",
        question: "How do I apply?",
        answer: [
          "Start with the puppy application. It helps us understand your household, your experience, and what you are hoping for in a French Bulldog.",
          "After we review your application, we follow up to talk through fit, questions, and any request to discuss breeding rights.",
        ],
      },
      {
        id: "reserve",
        question: "Does submitting an application reserve a puppy?",
        answer: [
          "No. An application is not a reservation, a hold, or a guarantee of approval.",
          "Placement begins with a conversation. Paperwork and payment are coordinated privately after a family is approved.",
        ],
        featured: true,
      },
      {
        id: "breeding-rights",
        question: "Are breeding rights available?",
        answer: [
          "Breeding rights are considered case by case. They are not automatically included with placement.",
          "If that matters to you, mention it on your application so we can discuss it directly.",
        ],
      },
      {
        id: "after-approval",
        question: "What happens after approval?",
        answer: [
          "Approved families coordinate paperwork, payment, Chicago pickup, or nationwide delivery with us privately.",
          "Those details are not handled as an instant online checkout, and they are not published as a one-size-fits-all policy on this site.",
        ],
      },
    ],
  },
  {
    id: "program",
    title: "Our program",
    items: [
      {
        id: "raised",
        question: "How are the puppies raised?",
        answer: [
          "Puppies are raised inside our home, as part of daily family life, with personal attention rather than a kennel environment.",
          "Families receive personal support after puppy placement.",
        ],
      },
      {
        id: "dna",
        question: "What does DNA-confirmed parentage mean?",
        answer: [
          "DNA testing confirmed that both parents are 100% French Bulldog. That result speaks to breed parentage.",
          "It is not the same as a comprehensive hereditary-health panel, and we do not describe our dogs as fully health tested on that basis alone.",
        ],
      },
      {
        id: "serbia",
        question: "What are Angel Bulldogs’ Serbian roots?",
        answer: [
          "The family and partner connected to Angel Bulldogs have extensive French Bulldog breeding experience in Serbia, and that same family connection is part of Bella’s original breeding story.",
          "The program now brings that family experience into a small Chicago home. Angel Bulldogs is a Chicago-based program; we do not present it as a long-running U.S. kennel under this name.",
        ],
      },
      {
        id: "three-litters",
        question: "Why will Bella have no more than three litters?",
        answer: [
          "Bella will have a maximum of three litters in her lifetime. That limit reflects a small-program philosophy: individual care, close observation, and personal attention.",
          "The three-litter limit is not a health guarantee. It is how we choose to work.",
        ],
      },
    ],
  },
  {
    id: "availability",
    title: "Availability",
    items: [
      {
        id: "none",
        question: "What if there are no available puppies?",
        answer: [
          "Availability can change, and we only list puppies that are currently available.",
          "If none are listed, you are welcome to submit an application to join our list for future availability, or contact us to introduce yourself.",
        ],
        featured: true,
      },
    ],
  },
];

export function getAllFaqs(): FaqItem[] {
  return faqGroups.flatMap((group) => group.items);
}

export function getFeaturedFaqs(limit = 5): FaqItem[] {
  const featured = getAllFaqs().filter((item) => item.featured);
  return featured.slice(0, limit);
}
