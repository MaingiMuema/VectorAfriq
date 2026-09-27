import { Metadata } from "next";
import { overlayPageOverride } from "@/lib/seo/metadata";
import SchemaMarkup, { buildWebPageSchema, buildBreadcrumbSchema, buildFAQSchema } from "@/components/seo/SchemaMarkup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke";

const baseMetadata: Metadata = {
    title: "FAQs",
    description: "Find answers to frequently asked questions about VectorAfriq Kenya - property search, listings, contacting agents, and more.",
    keywords: "VectorAfriq FAQ, Kenya real estate questions, property search help",
    alternates: {
        canonical: '/faqs',
    },
    openGraph: {
        title: "Frequently Asked Questions | VectorAfriq Kenya",
        description: "Find answers to common questions about VectorAfriq and property search in Kenya.",
        type: 'website',
    },
};

// Mirror the FAQ data from the page component for server-side schema generation
const faqData = [
    {
        question: "How do I start searching for properties?",
        answer: "You can start by using our search bar at the top of the page. Filter by location, property type, price range, and other criteria to find properties that match your needs.",
    },
    {
        question: "Do I need to create an account?",
        answer: "While you can browse properties without an account, creating one allows you to save favourite properties, set up alerts, and contact agents directly.",
    },
    {
        question: "Is VectorAfriq free to use?",
        answer: "Yes, VectorAfriq is completely free for property seekers. Agents and property owners may have different subscription plans for listing properties.",
    },
    {
        question: "How often are properties updated?",
        answer: "Our listings are updated in real-time as agents and property owners add or modify their listings. We also regularly verify listings to ensure accuracy.",
    },
    {
        question: "What if I find incorrect information in a listing?",
        answer: "You can report any inaccurate listings using the Report button on the property page. Our team will review and take appropriate action.",
    },
    {
        question: "Can I list my property for free?",
        answer: "We offer different listing packages. Basic listings are free, while premium features require a subscription. Visit our pricing page for more details.",
    },
    {
        question: "How do I contact an agent?",
        answer: "Each property listing includes contact buttons for calling, emailing, or WhatsApp messaging the agent. You can also visit their profile page for more contact options.",
    },
    {
        question: "Are the agents verified?",
        answer: "Yes, all agents on VectorAfriq go through a verification process. Look for the Verified badge on agent profiles.",
    },
    {
        question: "How do I reset my password?",
        answer: "Click on Forgot Password on the login page. Enter your email address, and we'll send you instructions to reset your password.",
    },
    {
        question: "Is my personal information secure?",
        answer: "Yes, we use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for more details.",
    },
];

export async function generateMetadata(): Promise<Metadata> {
  return overlayPageOverride("/faqs", baseMetadata);
}

export default function FAQsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageUrl = `${SITE_URL}/faqs`;
    return (
        <>
            <SchemaMarkup
                id="faqs-schema"
                schema={[
                    // FAQPage schema — unlocks Google rich result FAQ accordion in SERPs
                    buildFAQSchema(faqData) as Record<string, unknown>,
                    buildWebPageSchema({
                        name: "Frequently Asked Questions | VectorAfriq Kenya",
                        url: pageUrl,
                        description: "Find answers to frequently asked questions about VectorAfriq Kenya — property search, listings, contacting agents, and account security.",
                        type: "FAQPage",
                        breadcrumbs: [
                            { name: "Home", url: SITE_URL },
                            { name: "FAQs", url: pageUrl },
                        ],
                    }),
                    buildBreadcrumbSchema([
                        { name: "Home", url: SITE_URL },
                        { name: "FAQs", url: pageUrl },
                    ]),
                ]}
            />
            {children}
        </>
    );
}
